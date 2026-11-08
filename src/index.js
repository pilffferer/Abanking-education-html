import './styles/main.scss';

const storagePrefix = 'antools-layout:';
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(storagePrefix + key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(storagePrefix + key, JSON.stringify(value)); }
  catch { /* The page remains usable when browser storage is unavailable. */ }
};
const grid = document.querySelector('.catalog__grid');
const searchInput = document.querySelector('.search__input');
const status = document.querySelector('#tool-status');
const liked = new Set(read('likes', ['sketch']));
const collected = new Set(read('collection', []));
let category = 'all';
let collectionView = false;

function updateButtons(card) {
  const id = card.dataset.tool;
  const likeButton = card.querySelector('[data-action="like"]');
  likeButton.setAttribute('aria-pressed', String(liked.has(id)));
  likeButton.classList.toggle('tool-card__action_active', liked.has(id));
  card.querySelector('[data-action="collect"]').setAttribute('aria-pressed', String(collected.has(id)));
}

function filterTools(announce = true) {
  const query = searchInput.value.trim().toLowerCase();
  let count = 0;
  grid.querySelectorAll('.tool-card').forEach(card => {
    const matches = card.textContent.toLowerCase().includes(query) &&
      (category === 'all' || card.dataset.category === category) &&
      (!collectionView || collected.has(card.dataset.tool));
    card.hidden = !matches;
    if (matches) count += 1;
    updateButtons(card);
  });
  document.querySelector('.catalog__empty').hidden = count !== 0;
  document.querySelector('.catalog__filters').hidden = !query && category === 'all' && !collectionView;
  document.querySelector('.catalog__filter-label').textContent = collectionView ? 'My collection' :
    category !== 'all' ? category[0].toUpperCase() + category.slice(1) + ' tools' : `Results for “${searchInput.value.trim()}”`;
  if (announce) status.textContent = `${count} ${count === 1 ? 'tool' : 'tools'} shown.`;
}

function showAll() {
  searchInput.value = '';
  category = 'all';
  collectionView = false;
  filterTools();
}

document.querySelector('.search').addEventListener('submit', event => {
  event.preventDefault();
  filterTools();
  document.querySelector('#catalog').scrollIntoView({ block: 'start' });
});
searchInput.addEventListener('input', () => filterTools());
document.querySelector('.catalog__reset').addEventListener('click', showAll);

document.querySelectorAll('.navigation__option').forEach(button => {
  button.addEventListener('click', () => {
    category = button.dataset.category;
    collectionView = false;
    searchInput.value = '';
    button.closest('details').open = false;
    filterTools();
    document.querySelector('#catalog').scrollIntoView({ block: 'start' });
  });
});
document.querySelector('[data-view="collection"]').addEventListener('click', () => {
  searchInput.value = '';
  category = 'all';
  collectionView = true;
  filterTools();
});
document.addEventListener('click', event => {
  const menu = document.querySelector('.navigation__categories');
  if (!menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelector('.navigation__categories').open = false;
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const card = button.closest('.tool-card');
  const id = card.dataset.tool;
  const values = button.dataset.action === 'like' ? liked : collected;
  values.has(id) ? values.delete(id) : values.add(id);
  write(button.dataset.action === 'like' ? 'likes' : 'collection', [...values]);
  updateButtons(card);
  const title = card.querySelector('.tool-card__title').textContent;
  status.textContent = `${title} ${values.has(id) ? 'saved' : 'removed'}.`;
  if (collectionView && button.dataset.action === 'collect') filterTools();
});

const moreButton = document.querySelector('.catalog__more');
moreButton.addEventListener('click', () => {
  const resources = [
    { source: 'figma', id: 'figma-community', title: 'Figma Community', url: 'https://www.figma.com/community/', description: 'Explore design files, plugins and resources shared by the Figma community.' },
    { source: 'vscode', id: 'vscode-extensions', title: 'VS Code Extensions', url: 'https://marketplace.visualstudio.com/vscode', description: 'Find extensions and themes to personalise your development workflow.' },
    { source: 'notion', id: 'notion-templates', title: 'Notion Templates', url: 'https://www.notion.com/templates', description: 'Discover templates for projects, notes and everyday productivity.' }
  ];
  resources.forEach(resource => {
    const card = grid.querySelector(`[data-tool="${resource.source}"]`).cloneNode(true);
    card.classList.remove('tool-card_featured');
    card.classList.add('tool-card_resource');
    card.dataset.tool = resource.id;
    card.hidden = false;
    card.querySelector('.tool-card__title').textContent = resource.title;
    card.querySelector('.tool-card__price').textContent = 'Free resources';
    card.querySelector('.tool-card__description').textContent = resource.description;
    const visit = card.querySelector('.tool-card__visit');
    visit.href = resource.url;
    visit.querySelector('.sr-only').textContent = ' ' + resource.title;
    card.querySelector('[data-action="like"]').setAttribute('aria-label', 'Like ' + resource.title);
    card.querySelector('[data-action="collect"]').setAttribute('aria-label', 'Add ' + resource.title + ' to my collection');
    grid.append(card);
  });
  moreButton.textContent = 'All tools loaded';
  moreButton.disabled = true;
  filterTools();
});

const dialog = document.querySelector('.profile');
const profileForm = dialog.querySelector('form');
const nameInput = profileForm.elements.name;
const emailInput = profileForm.elements.email;
let profileMode = 'signup';
const updateProfile = () => {
  const active = read('active-profile', null);
  document.querySelector('.site-header__login').textContent = active ? 'Logout' : 'Login';
  document.querySelector('.site-header__signup').textContent = active ? active.name.slice(0, 12) : 'Sign Up';
};
document.querySelectorAll('[data-profile]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.profile === 'login' && read('active-profile', null)) {
      write('active-profile', null);
      updateProfile();
      status.textContent = 'Profile closed on this device.';
      return;
    }
    profileMode = button.dataset.profile;
    const existing = read('profile', null);
    dialog.querySelector('.profile__title').textContent = profileMode === 'login' ? 'Welcome back' : 'Join Antools';
    dialog.querySelector('.profile__description').textContent = profileMode === 'login' ?
      'Open the profile you saved on this device.' : 'Save a profile on this device and keep your favourite tools close.';
    nameInput.hidden = profileMode === 'login';
    nameInput.required = profileMode !== 'login';
    dialog.querySelector('[for="profile-name"]').hidden = nameInput.hidden;
    nameInput.value = existing?.name || '';
    emailInput.value = existing?.email || '';
    dialog.querySelector('.profile__message').textContent = '';
    dialog.querySelector('.profile__remove').hidden = !existing;
    dialog.querySelector('.profile__submit').textContent = profileMode === 'login' ? 'Open profile' : 'Save profile';
    dialog.showModal();
  });
});
profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  let profile = read('profile', null);
  if (profileMode === 'login') {
    if (!profile || profile.email !== email) {
      dialog.querySelector('.profile__message').textContent = 'No matching profile on this device. Use Sign Up to create one.';
      return;
    }
  } else {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    profile = { name, email };
    write('profile', profile);
  }
  write('active-profile', profile);
  updateProfile();
  dialog.close();
  status.textContent = `Welcome, ${profile.name}.`;
});
dialog.querySelector('.profile__close').addEventListener('click', () => dialog.close());
dialog.querySelector('.profile__remove').addEventListener('click', () => {
  write('profile', null);
  write('active-profile', null);
  updateProfile();
  dialog.close();
  status.textContent = 'Saved profile removed from this device.';
});
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

filterTools(false);
updateProfile();
