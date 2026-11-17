/**
 * 호박(Hobak) 중고거래 서비스 공통 데이터 및 상태 관리 모듈
 */
(() => {

const STORAGE_KEY = 'hobak_products_v2';
const LIKES_STORAGE_KEY = 'hobak_likes_v1';
const ACTOR_TOKEN_KEY = 'hobak_actor_token_v1';

const SUPABASE_URL = 'https://ofprtfmitzmsfdnylfgb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHJ0Zm1pdHptc2ZkbnlsZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MjgyNjQsImV4cCI6MjExMDQwNDI2NH0.Dvo9zXIbBeKsB2tDzyIlK4tuAj6qqj26qOVRF2QKIIo';

const supabaseClient =
  window.supabase && typeof window.supabase.createClient === 'function'
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

let currentAuthUser = null;

function getCurrentUser() {
  return currentAuthUser;
}

async function resolveProfileForSessionUser(user) {
  if (!user) return null;
  const metaNick = (user.user_metadata?.nickname || '').trim() || '호박이웃';
  if (!supabaseClient) {
    return { id: user.id, nickname: metaNick, mannerTemp: 36.5 };
  }
  try {
    const { data: existing } = await supabaseClient
      .from('profiles')
      .select('id, nickname, manner_temp')
      .eq('id', user.id)
      .maybeSingle();
    if (existing) {
      return {
        id: existing.id,
        nickname: existing.nickname || metaNick,
        mannerTemp: Number(existing.manner_temp ?? 36.5)
      };
    }
    const { data: inserted } = await supabaseClient
      .from('profiles')
      .upsert(
        { id: user.id, nickname: metaNick.slice(0, 20), primary_region: '한남동', manner_temp: 36.5 },
        { onConflict: 'id' }
      )
      .select('id, nickname, manner_temp')
      .single();
    return {
      id: user.id,
      nickname: inserted?.nickname || metaNick,
      mannerTemp: Number(inserted?.manner_temp ?? 36.5)
    };
  } catch {
    return { id: user.id, nickname: metaNick, mannerTemp: 36.5 };
  }
}

function initAuthListener(onChange) {
  if (!supabaseClient) {
    currentAuthUser = null;
    onChange?.(null);
    return;
  }

  const handleSession = async (session) => {
    if (session?.user) {
      currentAuthUser = await resolveProfileForSessionUser(session.user);
    } else {
      currentAuthUser = null;
    }
    onChange?.(currentAuthUser);
  };

  supabaseClient.auth.getSession().then(({ data }) => {
    handleSession(data?.session || null);
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    handleSession(session || null);
  });
}

async function signInWithEmail(email, password) {
  if (!supabaseClient) {
    throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) throw error;
  currentAuthUser = await resolveProfileForSessionUser(data.user);
  return currentAuthUser;
}

async function signUpWithEmail(email, password, nickname) {
  if (!supabaseClient) {
    throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
  }
  const cleanNick = nickname.trim().slice(0, 20);
  if (!cleanNick) {
    throw new Error('닉네임을 입력해주세요.');
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { nickname: cleanNick }
    }
  });
  if (error) throw error;

  if (data?.session && data?.user) {
    currentAuthUser = await resolveProfileForSessionUser(data.user);
    return { user: currentAuthUser, needsEmailConfirm: false };
  }
  return { user: null, needsEmailConfirm: true };
}

async function signOutUser() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentAuthUser = null;
}

function getActorToken() {
  if (currentAuthUser?.id) {
    return currentAuthUser.id;
  }
  try {
    let token = localStorage.getItem(ACTOR_TOKEN_KEY);
    if (!token) {
      token =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(ACTOR_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'anon-guest';
  }
}

function mapRowToProduct(row) {
  if (!row) return null;
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    sellerId: row.seller_id || null,
    status: row.status || 'on_sale',
    title: row.title,
    category: row.category,
    price: Number(row.price) || 0,
    isFree: Boolean(row.is_free),
    isNegotiable: Boolean(row.is_negotiable),
    description: row.description,
    region: row.region || '한남동',
    primaryRegion: row.primary_region || '한남동',
    sellerName: row.seller_nickname || profile?.nickname || '호박이웃',
    sellerMannerTemp: Number(profile?.manner_temp ?? 36.5),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    likes: Number(row.likes_count) || 0,
    chats: Number(row.chats_count) || 0,
    views: Number(row.views_count) || 0,
    payEnabled: row.pay_enabled !== false,
    images:
      Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : ['./assets/items/prod-1.jpg']
  };
}

// SVG 데이터 URI 생성 헬퍼 (네트워크 없이도 100% 선명하게 렌더링)
function createItemSvg(bg, accent, label, iconPath) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${bg}"/>
    <circle cx="200" cy="185" r="108" fill="#ffffff" fill-opacity="0.72"/>
    <g transform="translate(120,105)" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      ${iconPath}
    </g>
    <text x="200" y="344" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#4d5159">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ICONS = {
  padding:
    '<path d="M55 28 L80 18 L105 28 L132 58 L116 74 L106 62 L106 142 L54 142 L54 62 L44 74 L28 58 Z" fill="#f3efe8"/><path d="M54 92 H106" stroke-width="8"/><path d="M80 28 V142"/><path d="M62 18 Q80 6 98 18" stroke-width="8"/>',
  beanie:
    '<path d="M36 108 C36 52 124 52 124 108 Z" fill="#2b2d31"/><rect x="30" y="102" width="100" height="24" rx="8" fill="#1f2023"/>',
  shoes:
    '<path d="M24 110 L56 76 L88 92 L134 94 C142 94 146 108 140 116 L24 116 Z" fill="#6b705c"/><path d="M24 116 H140 V126 H24 Z" fill="#eae2b7"/>',
  dress:
    '<path d="M60 22 L100 22 L108 56 L124 142 L36 142 L52 56 Z" fill="#212124"/><path d="M60 22 Q80 38 100 22"/>',
  golf:
    '<line x1="56" y1="24" x2="108" y2="128" stroke-width="7"/><path d="M104 126 L132 118 L126 138 L98 136 Z" fill="#343a40"/>',
  laptop:
    '<rect x="26" y="34" width="108" height="74" rx="6" fill="#dee2e6"/><path d="M16 116 H144 L134 128 H26 Z" fill="#adb5bd"/>',
  desk:
    '<rect x="20" y="56" width="120" height="16" rx="3" fill="#ddb892"/><line x1="34" y1="72" x2="34" y2="136" stroke-width="8"/><line x1="126" y1="72" x2="126" y2="136" stroke-width="8"/>',
  dryer:
    '<path d="M36 52 H108 C122 52 128 74 114 82 H74 L66 134 H48 L56 82 H36 Z" fill="#e5989b"/><circle cx="116" cy="67" r="10" fill="#ffb4a2"/>',
  tumbler:
    '<path d="M56 42 H104 L98 138 H62 Z" fill="#2a9d8f"/><rect x="52" y="32" width="56" height="12" rx="4" fill="#264653"/>',
  coat:
    '<path d="M52 24 L80 18 L108 24 L132 54 L116 68 L104 56 L108 144 L52 144 L56 56 L44 68 L28 54 Z" fill="#a47148"/><line x1="80" y1="24" x2="80" y2="144"/>'
};

const CATEGORIES = [
  '여성의류',
  '남성패션/잡화',
  '신발',
  '디지털기기',
  '가구/인테리어',
  '스포츠/레저',
  '뷰티/미용',
  '생활주방'
];

const REGIONS = [
  '한남동',
  '수택3동',
  '이태원1동',
  '성수동1가',
  '역삼동',
  '서초동'
];

const POPULAR_KEYWORDS = [
  '패딩',
  '자전거',
  '세탁기',
  '책상',
  '골프채',
  '기저귀',
  '의자',
  '노트북',
  '가구',
  '냉장고',
  '모니터',
  '침대',
  '책장'
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'CC collect. 사가폭스구스다운패딩 (55)',
    category: '여성의류',
    price: 90000,
    isFree: false,
    isNegotiable: true,
    description:
      '따뜻하고 멋스러운 CC collect. 사가폭스퍼 구스다운벨트 패딩이에요.\n부드러운 퍼와 허리 벨트 디자인으로 여성스러운 실루엣이 살아납니다.\n\n- 사이즈: 55 (정사이즈)\n- 색상: 아이보리 / 크림 베이지\n- 상태: 실착 3회 미만, 드라이클리닝 완료하여 바로 입으실 수 있어요.\n- 직거래는 한남동 또는 수택3동 근처에서 가능합니다!',
    region: '수택3동, 한남동',
    primaryRegion: '한남동',
    sellerName: '윌슨',
    sellerMannerTemp: 66.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 1, // 1시간 전
    likes: 14,
    chats: 3,
    views: 128,
    payEnabled: true,
    images: [
      './assets/items/prod-1.jpg'
    ]
  },
  {
    id: 'prod-2',
    title: '크롬하츠 스타일 니트 비니 (블랙)',
    category: '남성패션/잡화',
    price: 70000,
    isFree: false,
    isNegotiable: false,
    description:
      '겨울철 포인트로 쓰기 좋은 블랙 니트 비니입니다.\n보풀 거의 없고 착용감 아주 좋습니다. 직거래 및 반값택배 모두 가능해요.',
    region: '한남동',
    primaryRegion: '한남동',
    sellerName: '한남스타일',
    sellerMannerTemp: 41.2,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    likes: 8,
    chats: 1,
    views: 74,
    payEnabled: true,
    images: ['./assets/items/prod-2.jpg']
  },
  {
    id: 'prod-3',
    title: '뉴발란스 990v5 카키 265mm 상태 최상',
    category: '신발',
    price: 98000,
    isFree: false,
    isNegotiable: true,
    description:
      '뉴발란스 990v5 카키 컬러 265 사이즈입니다.\n밑창 마모 거의 없고 스웨이드 상태도 아주 깨끗합니다. 박스 포함 구성입니다.',
    region: '한남동',
    primaryRegion: '한남동',
    sellerName: '스니커즈러버',
    sellerMannerTemp: 48.5,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    likes: 21,
    chats: 5,
    views: 215,
    payEnabled: true,
    images: ['./assets/items/prod-3.jpg']
  },
  {
    id: 'prod-4',
    title: '코스(COS) 블랙 롱 슬리브리스 원피스 S',
    category: '여성의류',
    price: 45000,
    isFree: false,
    isNegotiable: false,
    description:
      '매장에서 구매 후 1번 착용한 코스 블랙 원피스입니다.\n탄탄한 소재라 핏이 깔끔하게 떨어집니다.',
    region: '이태원1동',
    primaryRegion: '이태원1동',
    sellerName: '미니멀리스트',
    sellerMannerTemp: 39.8,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    likes: 11,
    chats: 2,
    views: 92,
    payEnabled: false,
    images: ['./assets/items/prod-4.jpg']
  },
  {
    id: 'prod-5',
    title: '타이틀리스트 Vokey SM9 웨지 골프채 56도',
    category: '스포츠/레저',
    price: 135000,
    isFree: false,
    isNegotiable: true,
    description:
      '그루브 살아있고 그립도 최근에 교체해서 바로 필드 나가실 수 있습니다.\n직거래 선호합니다.',
    region: '한남동',
    primaryRegion: '한남동',
    sellerName: '버디찬스',
    sellerMannerTemp: 52.3,
    createdAt: Date.now() - 1000 * 60 * 60 * 7,
    likes: 17,
    chats: 4,
    views: 164,
    payEnabled: true,
    images: ['./assets/items/prod-5.jpg']
  },
  {
    id: 'prod-6',
    title: '맥북 에어 M2 13인치 스페이스그레이 16G/256G',
    category: '디지털기기',
    price: 950000,
    isFree: false,
    isNegotiable: false,
    description:
      '배터리 성능 96%, 사이클 수 38회입니다.\n집에서만 거치해두고 사용해서 찍힘이나 기스 전혀 없습니다. 풀박스 보유.',
    region: '성수동1가',
    primaryRegion: '성수동1가',
    sellerName: '개발자호박',
    sellerMannerTemp: 58.1,
    createdAt: Date.now() - 1000 * 60 * 60 * 11,
    likes: 43,
    chats: 9,
    views: 412,
    payEnabled: true,
    images: ['./assets/items/prod-6.jpg']
  },
  {
    id: 'prod-7',
    title: '이케아 원목 책상 1400x700 (직접 픽업)',
    category: '가구/인테리어',
    price: 60000,
    isFree: false,
    isNegotiable: true,
    description:
      '이사로 인해 내놓습니다. 흔들림 없이 튼튼하고 상판 오염 없습니다.\n다리 분리 가능해서 승용차 뒷좌석에도 실립니다.',
    region: '한남동',
    primaryRegion: '한남동',
    sellerName: '우드홈',
    sellerMannerTemp: 44.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 15,
    likes: 19,
    chats: 6,
    views: 198,
    payEnabled: false,
    images: ['./assets/items/prod-7.jpg']
  },
  {
    id: 'prod-8',
    title: '다이슨 슈퍼소닉 헤어드라이어 로즈골드',
    category: '뷰티/미용',
    price: 260000,
    isFree: false,
    isNegotiable: false,
    description:
      '선물 받고 몇 번 사용 안 한 거의 새상품입니다.\n노즐 3종 및 거치대까지 모두 드립니다.',
    region: '역삼동',
    primaryRegion: '역삼동',
    sellerName: '뷰티유저',
    sellerMannerTemp: 46.7,
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    likes: 27,
    chats: 5,
    views: 250,
    payEnabled: true,
    images: ['./assets/items/prod-8.jpg']
  },
  {
    id: 'prod-9',
    title: '스탠리 퀜처 H2.0 플로우스테이트 텀블러 (나눔)',
    category: '생활주방',
    price: 0,
    isFree: true,
    isNegotiable: false,
    description:
      '사용하지 않고 보관만 한 텀블러 무료 나눔합니다.\n한남동 주민센터 앞에서 비대면 문고리 거래 원합니다.',
    region: '한남동',
    primaryRegion: '한남동',
    sellerName: '따뜻한이웃',
    sellerMannerTemp: 62.4,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: 35,
    chats: 12,
    views: 310,
    payEnabled: false,
    images: ['./assets/items/prod-9.jpg']
  },
  {
    id: 'prod-10',
    title: '막스마라 스타일 울 캐시미어 롱코트 브라운 (66)',
    category: '여성의류',
    price: 185000,
    isFree: false,
    isNegotiable: true,
    description:
      '부드러운 울 캐시미어 혼방 롱코트입니다.\n고급스러운 카멜 브라운 컬러라 가을 겨울 데일리로 입기 좋아요.',
    region: '서초동',
    primaryRegion: '서초동',
    sellerName: '코트콜렉터',
    sellerMannerTemp: 50.2,
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
    likes: 22,
    chats: 3,
    views: 179,
    payEnabled: true,
    images: ['./assets/items/prod-10.jpg']
  }
];

function getProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return [...INITIAL_PRODUCTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_PRODUCTS];
  } catch {
    return [...INITIAL_PRODUCTS];
  }
}

function saveProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('localStorage 저장 실패:', e);
  }
}

function getProductById(id) {
  const products = getProducts();
  return products.find((p) => p.id === id) || products[0];
}

function addProduct(newProductData) {
  const products = getProducts();
  const newProduct = {
    id: `prod-${Date.now()}`,
    title: newProductData.title.trim(),
    category: newProductData.category || '여성의류',
    price: newProductData.isFree ? 0 : Number(newProductData.price) || 0,
    isFree: Boolean(newProductData.isFree),
    isNegotiable: Boolean(newProductData.isNegotiable),
    description: newProductData.description.trim(),
    region: newProductData.region || '한남동',
    primaryRegion: (newProductData.region || '한남동').split(',')[0].trim(),
    sellerName: newProductData.sellerName?.trim() || '호박이웃',
    sellerMannerTemp: 36.5,
    createdAt: Date.now(),
    likes: 0,
    chats: 0,
    views: 1,
    payEnabled: true,
    images:
      newProductData.images && newProductData.images.length > 0
        ? newProductData.images
        : ['./assets/items/prod-1.jpg']
  };
  const updated = [newProduct, ...products];
  saveProducts(updated);
  return newProduct;
}

function getLikedIds() {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleLike(productId) {
  const likedIds = getLikedIds();
  const exists = likedIds.includes(productId);
  const nextLikes = exists
    ? likedIds.filter((id) => id !== productId)
    : [...likedIds, productId];
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(nextLikes));
  } catch {
    // ignore
  }

  const products = getProducts();
  const updatedProducts = products.map((p) => {
    if (p.id !== productId) return p;
    const delta = exists ? -1 : 1;
    return { ...p, likes: Math.max(0, (p.likes || 0) + delta) };
  });
  saveProducts(updatedProducts);

  return {
    liked: !exists,
    likesCount: updatedProducts.find((p) => p.id === productId)?.likes ?? 0
  };
}

function formatPrice(price, isFree = false) {
  if (isFree || Number(price) === 0) return '나눔';
  return `${Number(price).toLocaleString('ko-KR')}원`;
}

function formatTimeAgo(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

function showToast(message) {
  let toast = document.getElementById('hobak-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'hobak-toast';
    toast.className =
      'fixed bottom-7 left-1/2 -translate-x-1/2 translate-y-4 bg-[#212124]/90 text-white px-5 py-3 rounded-full text-sm font-semibold z-[9999] opacity-0 pointer-events-none transition-all duration-200 shadow-lg';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-4');
  }, 2200);
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function uploadImageIfDataUrl(src, index) {
  if (!supabaseClient || typeof src !== 'string' || !src.startsWith('data:image/')) {
    return src;
  }
  try {
    const blob = dataUrlToBlob(src);
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `items/${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabaseClient.storage
      .from('product-images')
      .upload(filePath, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
    const { data } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
    return data?.publicUrl || src;
  } catch (err) {
    console.warn('Storage 업로드 실패(로컬 이미지로 대체):', err?.message || err);
    return src;
  }
}

async function fetchProducts() {
  if (!supabaseClient) return getProducts();
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*, profiles(nickname, manner_temp)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      const mapped = data.map(mapRowToProduct);
      saveProducts(mapped);
      return mapped;
    }
    return getProducts();
  } catch (err) {
    console.warn('Supabase 상품 목록 조회 실패(로컬 폴백):', err?.message || err);
    return getProducts();
  }
}

async function fetchProductById(id) {
  if (!supabaseClient || !id) return getProductById(id);
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*, profiles(nickname, manner_temp)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const product = mapRowToProduct(data);
      // 조회수 증가 (비동기 백그라운드)
      supabaseClient
        .from('products')
        .update({ views_count: product.views + 1 })
        .eq('id', product.id)
        .then(() => {});
      product.views += 1;
      return product;
    }
    return getProductById(id);
  } catch (err) {
    console.warn('Supabase 상품 상세 조회 실패(로컬 폴백):', err?.message || err);
    return getProductById(id);
  }
}

async function addProductAsync(newProductData) {
  if (!supabaseClient) return addProduct(newProductData);

  const rawImages =
    newProductData.images && newProductData.images.length > 0
      ? newProductData.images
      : ['./assets/items/prod-1.jpg'];

  const uploadedUrls = await Promise.all(
    rawImages.map((src, idx) => uploadImageIfDataUrl(src, idx))
  );

  const sellerNickname =
    newProductData.sellerName?.trim() || currentAuthUser?.nickname || '호박이웃';
  const region = newProductData.region || '한남동';
  const primaryRegion = region.split(',')[0].trim();

  try {
    let sellerId = currentAuthUser?.id || null;
    if (sellerId) {
      await supabaseClient
        .from('profiles')
        .upsert(
          {
            id: sellerId,
            nickname: sellerNickname.slice(0, 20),
            primary_region: primaryRegion
          },
          { onConflict: 'id' }
        );
    } else {
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .insert({
          nickname: sellerNickname,
          primary_region: primaryRegion,
          manner_temp: 36.5
        })
        .select('id')
        .single();
      sellerId = profileData?.id || null;
    }

    const { data, error } = await supabaseClient
      .from('products')
      .insert({
        seller_id: sellerId,
        seller_nickname: sellerNickname,
        title: newProductData.title.trim(),
        category: newProductData.category || '여성의류',
        price: newProductData.isFree ? 0 : Number(newProductData.price) || 0,
        is_free: Boolean(newProductData.isFree),
        is_negotiable: Boolean(newProductData.isNegotiable),
        pay_enabled: true,
        description: newProductData.description.trim(),
        region,
        primary_region: primaryRegion,
        images: uploadedUrls
      })
      .select('*, profiles(nickname, manner_temp)')
      .single();

    if (error) throw error;
    const created = mapRowToProduct(data);
    const current = getProducts();
    saveProducts([created, ...current.filter((p) => p.id !== created.id)]);
    return created;
  } catch (err) {
    console.warn('Supabase 상품 등록 실패(로컬 저장으로 대체):', err?.message || err);
    return addProduct({ ...newProductData, images: uploadedUrls });
  }
}

async function fetchLikedIdsAsync() {
  if (!supabaseClient) return getLikedIds();
  try {
    const actorToken = getActorToken();
    const { data, error } = await supabaseClient
      .from('product_likes')
      .select('product_id')
      .eq('actor_token', actorToken);
    if (error) throw error;
    const ids = (data || []).map((row) => row.product_id);
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(ids));
    return ids;
  } catch (err) {
    console.warn('Supabase 관심 목록 조회 실패(로컬 폴백):', err?.message || err);
    return getLikedIds();
  }
}

async function toggleLikeAsync(productId, currentLikesCount = 0) {
  if (!supabaseClient) return toggleLike(productId);
  const actorToken = getActorToken();
  try {
    const { data: existing, error: selErr } = await supabaseClient
      .from('product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('actor_token', actorToken)
      .maybeSingle();
    if (selErr) throw selErr;

    let liked = false;
    let nextCount = Math.max(0, Number(currentLikesCount) || 0);

    if (existing) {
      const { error: delErr } = await supabaseClient
        .from('product_likes')
        .delete()
        .eq('id', existing.id);
      if (delErr) throw delErr;
      liked = false;
      nextCount = Math.max(0, nextCount - 1);
    } else {
      const { error: insErr } = await supabaseClient
        .from('product_likes')
        .insert({ product_id: productId, actor_token: actorToken });
      if (insErr) throw insErr;
      liked = true;
      nextCount += 1;
    }

    await supabaseClient
      .from('products')
      .update({ likes_count: nextCount })
      .eq('id', productId);

    const localLikes = getLikedIds();
    const nextLocal = liked
      ? Array.from(new Set([...localLikes, productId]))
      : localLikes.filter((id) => id !== productId);
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(nextLocal));

    return { liked, likesCount: nextCount };
  } catch (err) {
    console.warn('Supabase 관심 토글 실패(로컬 폴백):', err?.message || err);
    return toggleLike(productId);
  }
}

function getStatusLabel(status) {
  if (status === 'reserved') return '예약중';
  if (status === 'sold') return '거래완료';
  return '판매중';
}

async function updateProductStatusAsync(productId, status) {
  const validStatus = ['on_sale', 'reserved', 'sold'].includes(status) ? status : 'on_sale';
  const current = getProducts();
  const nextList = current.map((p) => (p.id === productId ? { ...p, status: validStatus } : p));
  saveProducts(nextList);

  if (!supabaseClient) {
    return nextList.find((p) => p.id === productId) || null;
  }

  try {
    const { data, error } = await supabaseClient
      .from('products')
      .update({ status: validStatus })
      .eq('id', productId)
      .select('*, profiles(nickname, manner_temp)')
      .single();
    if (error) throw error;
    const updated = mapRowToProduct(data);
    saveProducts(getProducts().map((p) => (p.id === productId ? updated : p)));
    return updated;
  } catch (err) {
    console.warn('Supabase 상태 변경 실패:', err?.message || err);
    return nextList.find((p) => p.id === productId) || null;
  }
}

async function updateProductAsync(productId, updatedData) {
  const rawImages =
    updatedData.images && updatedData.images.length > 0
      ? updatedData.images
      : ['./assets/items/prod-1.jpg'];

  const uploadedUrls = await Promise.all(
    rawImages.map((src, idx) => uploadImageIfDataUrl(src, idx))
  );

  const region = updatedData.region || '한남동';
  const primaryRegion = region.split(',')[0].trim();
  const sellerNickname =
    updatedData.sellerName?.trim() || currentAuthUser?.nickname || '호박이웃';
  const payload = {
    seller_nickname: sellerNickname,
    title: updatedData.title.trim(),
    category: updatedData.category || '여성의류',
    price: updatedData.isFree ? 0 : Number(updatedData.price) || 0,
    is_free: Boolean(updatedData.isFree),
    is_negotiable: Boolean(updatedData.isNegotiable),
    description: updatedData.description.trim(),
    region,
    primary_region: primaryRegion,
    images: uploadedUrls
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select('*, profiles(nickname, manner_temp)')
        .single();
      if (error) throw error;
      const updated = mapRowToProduct(data);
      saveProducts(getProducts().map((p) => (p.id === productId ? updated : p)));
      return updated;
    } catch (err) {
      console.warn('Supabase 게시글 수정 실패(로컬 반영):', err?.message || err);
    }
  }

  const nextList = getProducts().map((p) =>
    p.id === productId
      ? {
          ...p,
          title: payload.title,
          category: payload.category,
          price: payload.price,
          isFree: payload.is_free,
          isNegotiable: payload.is_negotiable,
          description: payload.description,
          region: payload.region,
          primaryRegion: payload.primary_region,
          sellerName: payload.seller_nickname,
          images: payload.images
        }
      : p
  );
  saveProducts(nextList);
  return nextList.find((p) => p.id === productId) || null;
}

async function deleteProductAsync(productId) {
  const nextList = getProducts().filter((p) => p.id !== productId);
  saveProducts(nextList);

  if (!supabaseClient) return true;
  try {
    const { error } = await supabaseClient.from('products').delete().eq('id', productId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase 게시글 삭제 실패:', err?.message || err);
    return false;
  }
}

  window.Hobak = Object.assign(window.Hobak || {}, {
    CATEGORIES,
    REGIONS,
    POPULAR_KEYWORDS,
    INITIAL_PRODUCTS,
    supabaseClient,
    getCurrentUser,
    initAuthListener,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    getProducts,
    saveProducts,
    getProductById,
    addProduct,
    getLikedIds,
    toggleLike,
    fetchProducts,
    fetchProductById,
    addProductAsync,
    fetchLikedIdsAsync,
    toggleLikeAsync,
    getStatusLabel,
    updateProductStatusAsync,
    updateProductAsync,
    deleteProductAsync,
    formatPrice,
    formatTimeAgo,
    showToast
  });
})();
