(() => {
  const {
    renderListPage,
    renderDetailPage,
    renderWritePage,
    DESIGN_SKILLS,
    getSavedDesignSkillId,
    applyDesignSkill,
    getCurrentUser,
    initAuthListener,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    showToast
  } = window.Hobak;

const appRoot = document.getElementById('app-root');
const searchForm = document.getElementById('global-search-form');
const searchInput = document.getElementById('global-search-input');
const navHome = document.getElementById('nav-home');

const authLoginBtn = document.getElementById('auth-login-btn');
const authUserBadge = document.getElementById('auth-user-badge');
const authLogoutBtn = document.getElementById('auth-logout-btn');

const authModal = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const authModalClose = document.getElementById('auth-modal-close');
const authTabLogin = document.getElementById('auth-tab-login');
const authTabSignup = document.getElementById('auth-tab-signup');
const authForm = document.getElementById('auth-form');
const authNicknameGroup = document.getElementById('auth-nickname-group');
const authNicknameInput = document.getElementById('auth-nickname');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authErrorMsg = document.getElementById('auth-error-msg');
const authSubmitBtn = document.getElementById('auth-submit-btn');

let currentSearchQuery = '';
let authMode = 'login';
let pendingAfterLogin = null;
let authInitialized = false;

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === 'list') {
    return { view: 'list' };
  }
  if (raw === 'write') {
    return { view: 'write' };
  }
  if (raw.startsWith('edit/')) {
    const id = decodeURIComponent(raw.slice('edit/'.length));
    return { view: 'edit', id };
  }
  if (raw.startsWith('detail/')) {
    const id = decodeURIComponent(raw.slice('detail/'.length));
    return { view: 'detail', id };
  }
  return { view: 'list' };
}

function navigateTo(hash) {
  if (window.location.hash === hash) {
    renderCurrentRoute();
  } else {
    window.location.hash = hash;
  }
}

function requestWriteNavigation() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (user) {
    navigateTo('#write');
    return;
  }
  pendingAfterLogin = () => navigateTo('#write');
  showToast('로그인 후 글을 작성할 수 있어요.');
  openAuthModal('login');
}

function renderCurrentRoute() {
  const route = parseHash();
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (route.view === 'detail') {
    renderDetailPage(appRoot, route.id, {
      onBackToList: () => navigateTo('#list'),
      onNavigateWrite: requestWriteNavigation,
      onEditProduct: (id) => navigateTo(`#edit/${encodeURIComponent(id)}`)
    });
  } else if (route.view === 'write' || route.view === 'edit') {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
      const targetHash = route.view === 'edit' ? `#edit/${encodeURIComponent(route.id)}` : '#write';
      pendingAfterLogin = () => navigateTo(targetHash);
      if (authInitialized) {
        showToast('로그인 후 글을 작성/수정할 수 있어요.');
        openAuthModal('login');
      }
      renderListPage(appRoot, {
        searchQuery: currentSearchQuery,
        onSelectProduct: (id) => navigateTo(`#detail/${encodeURIComponent(id)}`),
        onNavigateWrite: requestWriteNavigation,
        onSearchChange: (nextQuery) => {
          currentSearchQuery = nextQuery;
          if (searchInput && searchInput.value !== nextQuery) {
            searchInput.value = nextQuery;
          }
        }
      });
      return;
    }
    renderWritePage(appRoot, {
      editProductId: route.view === 'edit' ? route.id : null,
      onBackToList: () =>
        route.view === 'edit'
          ? navigateTo(`#detail/${encodeURIComponent(route.id)}`)
          : navigateTo('#list'),
      onCreated: (savedId) => navigateTo(`#detail/${encodeURIComponent(savedId)}`)
    });
  } else {
    renderListPage(appRoot, {
      searchQuery: currentSearchQuery,
      onSelectProduct: (id) => navigateTo(`#detail/${encodeURIComponent(id)}`),
      onNavigateWrite: requestWriteNavigation,
      onSearchChange: (nextQuery) => {
        currentSearchQuery = nextQuery;
        if (searchInput && searchInput.value !== nextQuery) {
          searchInput.value = nextQuery;
        }
      }
    });
  }
}

// 헤더 검색 폼 (한글 IME 조합 중 Enter 중복 방지)
searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  currentSearchQuery = searchInput.value.trim();
  navigateTo('#list');
});

searchInput?.addEventListener('keydown', (e) => {
  if (e.isComposing) return;
});

navHome?.addEventListener('click', (e) => {
  e.preventDefault();
  currentSearchQuery = '';
  if (searchInput) searchInput.value = '';
  navigateTo('#list');
});

function setAuthMode(mode) {
  authMode = mode === 'signup' ? 'signup' : 'login';
  const isSignup = authMode === 'signup';

  if (authModalTitle) authModalTitle.textContent = isSignup ? '호박 회원가입' : '호박 로그인';
  if (authSubmitBtn) authSubmitBtn.textContent = isSignup ? '회원가입' : '로그인';
  if (authErrorMsg) authErrorMsg.textContent = '';

  if (authTabLogin && authTabSignup) {
    authTabLogin.setAttribute('aria-selected', String(!isSignup));
    authTabSignup.setAttribute('aria-selected', String(isSignup));
    authTabLogin.className = !isSignup
      ? 'py-2 rounded-lg text-sm font-bold bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-xs transition-all'
      : 'py-2 rounded-lg text-sm font-semibold text-[var(--ds-text-muted)] transition-all';
    authTabSignup.className = isSignup
      ? 'py-2 rounded-lg text-sm font-bold bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-xs transition-all'
      : 'py-2 rounded-lg text-sm font-semibold text-[var(--ds-text-muted)] transition-all';
  }

  if (authNicknameGroup && authNicknameInput) {
    authNicknameGroup.classList.toggle('hidden', !isSignup);
    authNicknameInput.required = isSignup;
  }
  if (authPasswordInput) {
    authPasswordInput.setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
  }
}

function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  authForm?.reset();
  if (authErrorMsg) authErrorMsg.textContent = '';
  if (authModal && typeof authModal.showModal === 'function') {
    if (!authModal.open) authModal.showModal();
  }
}

function closeAuthModal() {
  if (authModal?.open) authModal.close();
}

function updateAuthHeaderUI(user) {
  if (user) {
    authLoginBtn?.classList.add('hidden');
    authLoginBtn?.classList.remove('inline-flex');

    if (authUserBadge) {
      authUserBadge.textContent = user.nickname || '호박이웃';
      authUserBadge.classList.remove('hidden');
      authUserBadge.classList.add('inline-flex');
    }
    authLogoutBtn?.classList.remove('hidden');
    authLogoutBtn?.classList.add('inline-flex');
  } else {
    authLoginBtn?.classList.remove('hidden');
    authLoginBtn?.classList.add('inline-flex');

    authUserBadge?.classList.add('hidden');
    authUserBadge?.classList.remove('inline-flex');

    authLogoutBtn?.classList.add('hidden');
    authLogoutBtn?.classList.remove('inline-flex');
  }
}

function formatAuthError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (msg.includes('User already registered')) {
    return '이미 가입된 이메일입니다. 로그인 탭을 이용해 주세요.';
  }
  if (msg.includes('Password should be at least')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  if (msg.includes('Email not confirmed')) {
    return '이메일 인증이 필요합니다. 메일함을 확인해 주세요.';
  }
  return msg || '인증 처리 중 오류가 발생했습니다.';
}

authLoginBtn?.addEventListener('click', () => {
  pendingAfterLogin = null;
  openAuthModal('login');
});

authLogoutBtn?.addEventListener('click', async () => {
  await signOutUser();
  updateAuthHeaderUI(null);
  showToast('로그아웃되었습니다.');
  if (parseHash().view === 'write') {
    navigateTo('#list');
  }
});

authModalClose?.addEventListener('click', () => {
  pendingAfterLogin = null;
  closeAuthModal();
});

authModal?.addEventListener('cancel', () => {
  pendingAfterLogin = null;
});

authTabLogin?.addEventListener('click', () => setAuthMode('login'));
authTabSignup?.addEventListener('click', () => setAuthMode('signup'));

authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (authErrorMsg) authErrorMsg.textContent = '';

  const email = authEmailInput?.value.trim() || '';
  const password = authPasswordInput?.value || '';
  const nickname = authNicknameInput?.value.trim() || '';

  if (authMode === 'signup' && !nickname) {
    if (authErrorMsg) authErrorMsg.textContent = '닉네임을 입력해주세요.';
    authNicknameInput?.focus();
    return;
  }
  if (!email) {
    if (authErrorMsg) authErrorMsg.textContent = '이메일을 입력해주세요.';
    authEmailInput?.focus();
    return;
  }
  if (password.length < 6) {
    if (authErrorMsg) authErrorMsg.textContent = '비밀번호는 6자 이상 입력해주세요.';
    authPasswordInput?.focus();
    return;
  }

  if (authSubmitBtn) {
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = '처리 중...';
  }

  try {
    if (authMode === 'signup') {
      const res = await signUpWithEmail(email, password, nickname);
      if (res.needsEmailConfirm) {
        showToast('회원가입 확인 메일을 발송했습니다. 메일함에서 인증 후 로그인해 주세요.');
        setAuthMode('login');
        return;
      }
      updateAuthHeaderUI(res.user);
      showToast(`${res.user?.nickname || nickname}님, 환영합니다!`);
    } else {
      const user = await signInWithEmail(email, password);
      updateAuthHeaderUI(user);
      showToast(`${user?.nickname || '호박이웃'}님, 로그인되었습니다.`);
    }

    closeAuthModal();
    const nextAction = pendingAfterLogin;
    pendingAfterLogin = null;
    if (typeof nextAction === 'function') {
      nextAction();
    }
  } catch (err) {
    if (authErrorMsg) authErrorMsg.textContent = formatAuthError(err);
  } finally {
    if (authSubmitBtn) {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = authMode === 'signup' ? '회원가입' : '로그인';
    }
  }
});

initAuthListener((user) => {
  authInitialized = true;
  updateAuthHeaderUI(user);
  if (user && typeof pendingAfterLogin === 'function') {
    const nextAction = pendingAfterLogin;
    pendingAfterLogin = null;
    nextAction();
  }
});

window.addEventListener('hashchange', renderCurrentRoute);

// 디자인 스킬 스위처 초기화 (R~S 13종 + 기본)
function setupDesignSkillSwitcher() {
  const selectEl = document.getElementById('design-skill-select');
  const descEl = document.getElementById('design-skill-desc');
  const chipsEl = document.getElementById('design-skill-quick-chips');
  if (!selectEl || !DESIGN_SKILLS) return;

  const quickIds = [
    'default',
    'neon',
    'neobrutalism',
    'neumorphism',
    'pacman',
    'perspective',
    'power',
    'pulsed',
    'riso',
    'sega',
    'shadcn',
    'sketch',
    'stitch'
  ];

  selectEl.innerHTML = DESIGN_SKILLS.map(
    (skill) => `<option value="${skill.id}">${skill.name}</option>`
  ).join('');

  const syncUi = (skillId) => {
    const current = DESIGN_SKILLS.find((s) => s.id === skillId) || DESIGN_SKILLS[0];
    selectEl.value = current.id;
    if (descEl) descEl.textContent = current.desc;
    if (chipsEl) {
      chipsEl.innerHTML = quickIds
        .map((id) => {
          const item = DESIGN_SKILLS.find((s) => s.id === id);
          if (!item) return '';
          const active = item.id === current.id;
          return `<button
            type="button"
            data-skill-id="${item.id}"
            aria-pressed="${active}"
            class="px-2.5 py-1 rounded-[var(--ds-radius-pill)] border text-[11px] font-bold whitespace-nowrap transition-colors ${
              active
                ? 'bg-[var(--ds-primary)] text-[var(--ds-on-primary)] border-[var(--ds-primary)]'
                : 'bg-[var(--ds-surface)] text-[var(--ds-text-muted)] border-[var(--ds-border)] hover:text-[var(--ds-text)]'
            }"
          >${item.name.replace(' (기본)', '')}</button>`;
        })
        .join('');

      chipsEl.querySelectorAll('[data-skill-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const next = applyDesignSkill(btn.getAttribute('data-skill-id'));
          syncUi(next.id);
          showToast(`${next.name} 디자인 스킬 적용됨`);
        });
      });
    }
  };

  selectEl.addEventListener('change', (e) => {
    const next = applyDesignSkill(e.target.value);
    syncUi(next.id);
    showToast(`${next.name} 디자인 스킬 적용됨`);
  });

  syncUi(getSavedDesignSkillId());
}

setupDesignSkillSwitcher();

// 초기 진입 렌더링
renderCurrentRoute();
})();
