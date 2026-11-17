# 호박 (Hobak)

우리 동네 따뜻한 중고거래 웹 서비스 **호박**입니다.

## 주요 기능
- **상품 목록**: 카테고리·지역·검색어·인기 검색어 필터, 상태 태그(`판매중`, `예약중`, `거래완료`), 거래완료 카드 흐림 처리
- **상품 상세**: 이미지 캐러셀, 판매자 프로필 및 매너온도, 관심(찜) 토글, 작성자 전용 상태 변경/수정/삭제
- **글쓰기 / 수정**: 다중 이미지 업로드(최대 10장, Supabase Storage 연동), 실시간 유효성 검사
- **회원가입 / 로그인**: Supabase Auth 기반 이메일/비밀번호 인증 및 닉네임 프로필 자동 생성, 비로그인 글쓰기 가드
- **디자인 스킬 스위처**: `awesome-design-skills` N~S 23종 + 기본 테마 실시간 전환

## 기술 스택
- HTML5 / Tailwind CSS (Play CDN) / Vanilla JavaScript
- Supabase (PostgreSQL, Auth, Storage)

## 실행 방법
정적 호스팅(GitHub Pages, Vercel, Netlify 등)에 배포하거나 로컬에서 `index.html`을 실행하세요.
