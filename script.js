function cartoonAvatar(name) {
  const backgrounds = {
    'Rahul Sharma': 'b6e3f4',
    'Priya Nair': 'c0aede',
    'Vikram Patel': 'ffd5dc',
    'Neha Joshi': 'd1f4d3',
    'Arjun Menon': 'ffdfbf'
  };
  const background = backgrounds[name] || 'b6e3f4';
  return `https://api.dicebear.com/9.x/big-ears/svg?seed=${encodeURIComponent(name)}&backgroundColor=${background}`;
}

const contacts = {
  rahul: {
    name: 'Rahul Sharma', avatar: cartoonAvatar('Rahul Sharma'), status: 'Last seen today at 10:42 AM', online: false,
    replies: [
      'Thanks for the update. Please add it to the project board before our review.',
      'Sounds good. I’ll check the revised timeline before the 2 PM meeting.',
      'Great, please share the checklist with Priya as well.'
    ],
    messages: [
      { from: 'them', text: 'Hi! How are you?', time: '10:40 AM' },
      { from: 'me', text: "I'm good! How about you?", time: '10:41 AM' },
      { from: 'them', text: "I'm doing great, thanks!", time: '10:42 AM' },
      { from: 'them', text: 'Can we review the sprint tasks at the office today?', time: '10:43 AM' },
      { from: 'me', text: "Sure. I'll finish the API integration checklist before lunch.", time: '10:44 AM' },
      { from: 'them', text: 'Great. Please update the project timeline before stand-up too.', time: '10:45 AM' },
      { from: 'me', text: "Done. I'll share the revised plan with the team at 2 PM.", time: '10:46 AM' },
      { from: 'them', text: "Perfect, thanks. Let's go through it together this afternoon.", time: '10:47 AM' }
    ]
  },
  priya: {
    name: 'Priya Nair', avatar: cartoonAvatar('Priya Nair'), status: 'Online now', online: true,
    replies: [
      'I’ll review the API task and share the updated status before lunch.',
      'The tests passed on my end. I’ve added the results to the project doc.',
      'Can you tag me on the pull request when it’s ready?'
    ],
    messages: [
      { from: 'them', text: 'The API tests are ready for review.', time: '10:16 AM' },
      { from: 'me', text: 'Great, I’ll run through them after the team stand-up.', time: '10:18 AM' },
      { from: 'them', text: 'Thanks! I added the test results to the project doc.', time: '10:19 AM' }
    ]
  },
  vikram: {
    name: 'Vikram Patel', avatar: cartoonAvatar('Vikram Patel'), status: 'Last seen yesterday', online: false,
    replies: [
      'I’ve added my feedback to the project doc. Let’s review it after stand-up.',
      'The timeline looks good. I’ll take the next task from the sprint board.',
      'I can go over those changes with you after lunch.'
    ],
    messages: [
      { from: 'them', text: 'I’ve added notes to the project doc.', time: 'Yesterday' },
      { from: 'me', text: 'Thanks. I’ll check the timeline and leave comments this morning.', time: 'Yesterday' }
    ]
  },
  neha: {
    name: 'Neha Joshi', avatar: cartoonAvatar('Neha Joshi'), status: 'Last seen yesterday', online: false,
    replies: [
      'I can take the testing task. Send me the latest build when it’s ready.',
      'I’ll add the test cases to our sprint checklist today.',
      'Thanks, I’ll check the new build and send you the results.'
    ],
    messages: [
      { from: 'them', text: 'Can take the testing task this sprint.', time: 'Yesterday' },
      { from: 'me', text: 'Perfect. I’ll share the build and task notes this afternoon.', time: 'Yesterday' }
    ]
  }
};

const storageKey = 'vconnect.contacts.v2';
try {
  const savedContacts = JSON.parse(localStorage.getItem(storageKey) || '{}');
  Object.entries(savedContacts).forEach(([id, saved]) => {
    const name = saved.name || contacts[id]?.name || 'Wechat contact';
    contacts[id] = { ...contacts[id], ...saved, avatar: cartoonAvatar(name) };
  });
} catch {
  // Storage can be unavailable in restricted browser contexts.
}

const messenger = document.querySelector('.messenger');
const conversationList = document.querySelector('#conversation-list');
const conversationBody = document.querySelector('#conversation-body');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const searchInput = document.querySelector('#search-input');
const newChatDialog = document.querySelector('#new-chat-dialog');
let activeContact = 'rahul';
let onlineOnly = false;

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function persistContacts() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(contacts));
  } catch {
    document.querySelector('#live-status').textContent = 'Changes will not be saved after you close this page.';
  }
}

function getContactButton(contactId) {
  return conversationList.querySelector(`[data-contact="${CSS.escape(contactId)}"]`);
}

function makeContactButton(contactId) {
  const contact = contacts[contactId];
  const button = document.createElement('button');
  button.className = 'conversation';
  button.type = 'button';
  button.dataset.contact = contactId;

  const avatarWrap = document.createElement('span');
  avatarWrap.className = 'avatar-wrap';
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = contact.avatar;
  avatar.alt = '';
  const presence = document.createElement('i');
  presence.className = `presence${contact.online ? ' online' : ''}`;
  avatarWrap.append(avatar, presence);

  const copy = document.createElement('span');
  copy.className = 'conversation-copy';
  const top = document.createElement('span');
  top.className = 'conversation-top';
  const name = document.createElement('strong');
  name.textContent = contact.name;
  const time = document.createElement('time');
  time.textContent = 'New';
  top.append(name, time);
  const bottom = document.createElement('span');
  bottom.className = 'conversation-bottom';
  const preview = document.createElement('span');
  preview.className = 'preview';
  preview.textContent = 'Start a conversation';
  bottom.append(preview);
  copy.append(top, bottom);
  button.append(avatarWrap, copy);
  conversationList.prepend(button);
  return button;
}

function updateContactButton(contactId, message, moveToTop = true) {
  const button = getContactButton(contactId) || makeContactButton(contactId);
  const preview = button.querySelector('.preview');
  const time = button.querySelector('.conversation-top time');
  preview.textContent = message.text;
  time.textContent = message.time;
  if (moveToTop) conversationList.prepend(button);
  applyConversationFilters();
}

function addMessage(message) {
  const row = document.createElement('div');
  row.className = `message-row ${message.from === 'me' ? 'outgoing' : 'incoming'}`;
  if (message.from !== 'me') {
    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = contacts[activeContact].avatar;
    avatar.alt = contacts[activeContact].name;
    row.append(avatar);
  }

  const content = document.createElement('div');
  content.className = 'message-content';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = message.text;
  const timestamp = document.createElement('time');
  timestamp.className = 'message-time';
  timestamp.textContent = message.time;
  if (message.from === 'me') {
    const checks = document.createElement('span');
    checks.className = 'read-check';
    checks.setAttribute('aria-label', 'Saved on this device');
    checks.textContent = ' ✓✓';
    timestamp.append(checks);
  }
  content.append(bubble, timestamp);
  row.append(content);
  conversationBody.append(row);
  conversationBody.scrollTop = conversationBody.scrollHeight;
}

function renderConversation(contactId) {
  const contact = contacts[contactId];
  activeContact = contactId;
  document.querySelector('#header-name').textContent = contact.name;
  document.querySelector('#header-avatar').src = contact.avatar;
  document.querySelector('#header-avatar').alt = contact.name;
  const status = document.querySelector('#last-seen');
  status.replaceChildren();
  if (contact.online) {
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    status.append(dot);
  }
  status.append(document.createTextNode(contact.status));
  document.querySelector('.chat-panel').setAttribute('aria-label', `Conversation with ${contact.name}`);
  conversationBody.replaceChildren();

  const divider = document.createElement('div');
  divider.className = 'date-divider';
  divider.innerHTML = '<span></span><time>TODAY</time><span></span>';
  conversationBody.append(divider);
  contact.messages.forEach(addMessage);
  conversationBody.scrollTop = conversationBody.scrollHeight;
  document.querySelectorAll('.conversation').forEach(button => {
    const selected = button.dataset.contact === contactId;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  getContactButton(contactId)?.querySelector('.unread')?.remove();
}

function openConversation(contactId) {
  renderConversation(contactId);
  messenger.classList.add('chat-open');
  messageInput.focus();
}

function applyConversationFilters() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  document.querySelectorAll('.conversation').forEach(button => {
    const contact = contacts[button.dataset.contact];
    const matchesSearch = contact.name.toLocaleLowerCase().includes(query);
    button.hidden = !matchesSearch || (onlineOnly && !contact.online);
  });
}

function sendTextMessage(text) {
  const contactId = activeContact;
  const message = { from: 'me', text, time: formatTime() };
  contacts[contactId].messages.push(message);
  addMessage(message);
  updateContactButton(contactId, message);
  persistContacts();
  const contact = contacts[contactId];
  const replies = contact.replies || ['Thanks for the update. I’ll take a look and get back to you.'];
  const replyText = replies[Math.floor(Math.random() * replies.length)];
  const reply = { from: 'them', text: replyText, time: formatTime() };
  contacts[contactId].messages.push(reply);
  updateContactButton(contactId, reply);
  persistContacts();
  if (activeContact === contactId) addMessage(reply);
}

Object.keys(contacts).forEach(contactId => {
  if (!getContactButton(contactId)) makeContactButton(contactId);
  const lastMessage = contacts[contactId].messages.at(-1);
  if (lastMessage) updateContactButton(contactId, lastMessage, false);
});
document.querySelector('.total-count').textContent = Object.keys(contacts).length;
renderConversation(activeContact);

conversationList.addEventListener('click', event => {
  const button = event.target.closest('.conversation');
  if (button) openConversation(button.dataset.contact);
});

messageForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  sendTextMessage(text);
  messageInput.value = '';
  messageInput.focus();
});

searchInput.addEventListener('input', applyConversationFilters);
document.querySelector('#all-messages').addEventListener('click', () => {
  searchInput.value = '';
  onlineOnly = false;
  const filterButton = document.querySelector('#online-filter');
  filterButton.setAttribute('aria-pressed', 'false');
  filterButton.title = 'Show online contacts only';
  applyConversationFilters();
  searchInput.focus();
});

document.querySelector('#online-filter').addEventListener('click', event => {
  onlineOnly = !onlineOnly;
  event.currentTarget.setAttribute('aria-pressed', String(onlineOnly));
  event.currentTarget.title = onlineOnly ? 'Show all contacts' : 'Show online contacts only';
  applyConversationFilters();
});

document.querySelector('#emoji-button').addEventListener('click', () => {
  messageInput.value += '😊';
  messageInput.focus();
});

document.querySelector('.attach-button').addEventListener('click', () => document.querySelector('#file-input').click());
document.querySelector('#file-input').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  sendTextMessage(`📎 ${file.name} (${Math.ceil(file.size / 1024)} KB)`);
  event.target.value = '';
});

document.querySelector('.compose-button').addEventListener('click', () => {
  newChatDialog.showModal();
  document.querySelector('#new-contact-name').focus();
});
document.querySelector('#cancel-new-chat').addEventListener('click', () => newChatDialog.close());
document.querySelector('#new-chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const nameInput = document.querySelector('#new-contact-name');
  const name = nameInput.value.trim();
  if (!name) return;
  const contactId = `contact-${Date.now()}`;
  contacts[contactId] = {
    name,
    avatar: cartoonAvatar(name),
    status: 'New conversation',
    online: false,
    messages: []
  };
  makeContactButton(contactId);
  document.querySelector('.total-count').textContent = Object.keys(contacts).length;
  persistContacts();
  nameInput.value = '';
  newChatDialog.close();
  openConversation(contactId);
});

function showCallNotice(kind) {
  document.querySelector('#details-title').textContent = `${kind} call`;
  document.querySelector('#details-copy').textContent = `${kind} calling is not connected in this browser-only demo.`;
  document.querySelector('#details-dialog').showModal();
}

document.querySelector('#voice-call').addEventListener('click', () => showCallNotice('Voice'));
document.querySelector('#video-call').addEventListener('click', () => showCallNotice('Video'));

document.querySelector('#mobile-back').addEventListener('click', () => messenger.classList.remove('chat-open'));
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});
