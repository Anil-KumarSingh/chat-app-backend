const Message = require('../models/Message');
const User = require('../models/User');

const normalizePhone = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/\D/g, '');
  return /^\d{8,15}$/.test(normalized) ? normalized : '';
};

const searchPeople = async (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (query.length < 2 || query.length > 80) {
      return res.status(400).json({ message: 'Enter at least two characters to search.' });
    }
    const usernameQuery = query.replace(/^@/, '');
    const escapedUsername = usernameQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEmail = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const phone = normalizePhone(query);
    const conditions = [
      { username: { $regex: `^${escapedUsername}`, $options: 'i' } },
      { email: { $regex: `^${escapedEmail}`, $options: 'i' } },
    ];
    if (phone) conditions.push({ phone: { $regex: `^${phone}` } });

    const isEmailSearch = query.includes('@') && !query.startsWith('@');
    const fields = isEmailSearch ? 'name username phone onlineStatus email' : 'name username phone onlineStatus';
    const people = await User.find({ _id: { $ne: req.user._id }, $or: conditions })
      .select(fields)
      .limit(8)
      .lean();
    res.json(people);
  } catch (error) {
    console.error('People search failed:', error.message);
    res.status(500).json({ message: 'Could not search for people.' });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentId = req.user._id.toString();
    const [messages, currentUser] = await Promise.all([
      Message.find({ $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] })
        .sort({ timestamp: -1 })
        .lean(),
      User.findById(req.user._id).select('contacts'),
    ]);

    const lastMessageByPerson = new Map();
    for (const message of messages) {
      const senderId = message.senderId.toString();
      const receiverId = message.receiverId.toString();
      const personId = senderId === currentId ? receiverId : senderId;
      if (!lastMessageByPerson.has(personId)) lastMessageByPerson.set(personId, message);
    }

    const contactIds = (currentUser?.contacts || []).map((id) => id.toString());
    const personIds = [...new Set([...contactIds, ...lastMessageByPerson.keys()])];
    const people = personIds.length
      ? await User.find({ _id: { $in: personIds } }).select('name username phone onlineStatus role')
      : [];

    const conversations = people.map((person) => {
      const lastMessage = lastMessageByPerson.get(person._id.toString());
      return {
        _id: person._id,
        name: person.name,
        username: person.username || '',
        phone: person.phone || '',
        onlineStatus: person.onlineStatus,
        lastMessage: lastMessage?.message || '',
        lastMessageAt: lastMessage?.timestamp || null,
      };
    }).sort((a, b) => {
      if (!a.lastMessageAt) return b.lastMessageAt ? 1 : a.name.localeCompare(b.name);
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Conversation list failed:', error.message);
    res.status(500).json({ message: 'Could not load conversations.' });
  }
};

const addContact = async (req, res) => {
  try {
    const personId = req.body?.userId;
    if (typeof personId !== 'string' || !/^[a-f\d]{24}$/i.test(personId)) {
      return res.status(400).json({ message: 'Choose a valid person to add.' });
    }
    const person = await User.findById(personId).select('name username phone onlineStatus');
    if (!person) return res.status(404).json({ message: 'That account could not be found.' });
    if (person._id.equals(req.user._id)) return res.status(400).json({ message: 'That is your own phone number.' });

    await User.updateOne({ _id: req.user._id }, { $addToSet: { contacts: person._id } });
    res.status(200).json({ ...person.toObject(), lastMessage: '', lastMessageAt: null });
  } catch (error) {
    console.error('Add contact failed:', error.message);
    res.status(500).json({ message: 'Could not add this contact.' });
  }
};

const updateMyPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ message: 'Enter a valid phone number with country code.' });
    const duplicate = await User.findOne({ phone, _id: { $ne: req.user._id } }).select('_id');
    if (duplicate) return res.status(409).json({ message: 'That number is already linked to another account.' });

    const user = await User.findByIdAndUpdate(req.user._id, { phone }, { new: true }).select('name email phone role');
    res.json(user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That number is already linked to another account.' });
    console.error('Phone update failed:', error.message);
    res.status(500).json({ message: 'Could not save your phone number.' });
  }
};

module.exports = { getConversations, searchPeople, addContact, updateMyPhone };
