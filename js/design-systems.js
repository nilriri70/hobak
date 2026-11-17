/**
 * bergside/awesome-design-skills R~S 13종 디자인 시스템 레지스트리
 * (Refined, Retro, Riso, Roku, Sega, Shadcn, Sketch, Skeumorphism, Sleek, Spacious, Square, Stitch, Storytelling)
 */
(() => {
  const THEME_STORAGE_KEY = 'hobak_design_skill_v1';

  const DESIGN_SKILLS = [
    {
      id: 'default',
      name: 'Hobak (기본)',
      desc: '따뜻한 호박 오렌지 기본 마켓 스타일',
      vars: {
        '--ds-primary': '#ff6f0f',
        '--ds-primary-hover': '#e5600a',
        '--ds-secondary': '#fff3eb',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#ffffff',
        '--ds-surface': '#ffffff',
        '--ds-surface-muted': '#f8f9fa',
        '--ds-text': '#212124',
        '--ds-text-muted': '#868b94',
        '--ds-border': '#eaebee',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '12px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 1px 3px rgba(0, 0, 0, 0.06)',
        '--ds-font-body': "'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'neon',
      name: 'Neon',
      desc: '형광 라임(#BBF351) + 일렉트릭 블루(#00BCFF) 네온 글로우',
      vars: {
        '--ds-primary': '#BBF351',
        '--ds-primary-hover': '#A3E635',
        '--ds-secondary': '#182412',
        '--ds-on-primary': '#111827',
        '--ds-bg': '#0B0F19',
        '--ds-surface': '#111827',
        '--ds-surface-muted': '#1E293B',
        '--ds-text': '#F8FAFC',
        '--ds-text-muted': '#94A3B8',
        '--ds-border': '#00BCFF',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '10px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 0 16px rgba(0, 188, 255, 0.28)',
        '--ds-font-body': "'Roboto', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'STIX Two Text', 'Noto Serif KR', serif"
      }
    },
    {
      id: 'neobrutalism',
      name: 'Neobrutalism',
      desc: '비비드 옐로우(#FDC800) + 굵은 보더 & 솔리드 오프셋 그림자',
      vars: {
        '--ds-primary': '#FDC800',
        '--ds-primary-hover': '#EAB308',
        '--ds-secondary': '#EDE9FE',
        '--ds-on-primary': '#1C293C',
        '--ds-bg': '#FBFBF9',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F3F4F6',
        '--ds-text': '#1C293C',
        '--ds-text-muted': '#475569',
        '--ds-border': '#1C293C',
        '--ds-border-width': '2px',
        '--ds-border-style': 'solid',
        '--ds-radius': '6px',
        '--ds-radius-pill': '6px',
        '--ds-shadow': '4px 4px 0px #1C293C',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'neumorphism',
      name: 'Neumorphism',
      desc: '스톤 서피스(#E7E5E4) + 양각/음각 소프트 섀도우 촉감 UI',
      vars: {
        '--ds-primary': '#006666',
        '--ds-primary-hover': '#004D4D',
        '--ds-secondary': '#F1F2F5',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#E7E5E4',
        '--ds-surface': '#E7E5E4',
        '--ds-surface-muted': '#DCDAD9',
        '--ds-text': '#1E2938',
        '--ds-text-muted': '#57534E',
        '--ds-border': 'transparent',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '16px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '6px 6px 14px #C5C3C2, -6px -6px 14px #FFFFFF',
        '--ds-font-body': "'Space Mono', 'Noto Sans KR', monospace",
        '--ds-font-display': "'Space Mono', 'Noto Sans KR', monospace"
      }
    },
    {
      id: 'pacman',
      name: 'Pacman',
      desc: 'Press Start 2P 픽셀 폰트, 도트 보더 & 8비트 아케이드',
      vars: {
        '--ds-primary': '#2A3FE5',
        '--ds-primary-hover': '#1E31C8',
        '--ds-secondary': '#F4B9B0',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#07070A',
        '--ds-surface': '#111118',
        '--ds-surface-muted': '#1B1B26',
        '--ds-text': '#FACC15',
        '--ds-text-muted': '#F4B9B0',
        '--ds-border': '#2A3FE5',
        '--ds-border-width': '3px',
        '--ds-border-style': 'dotted',
        '--ds-radius': '4px',
        '--ds-radius-pill': '4px',
        '--ds-shadow': '0 0 0 2px rgba(42, 63, 229, 0.35)',
        '--ds-font-body': "'Space Mono', 'Noto Sans KR', monospace",
        '--ds-font-display': "'Press Start 2P', 'Noto Sans KR', monospace"
      }
    },
    {
      id: 'paper',
      name: 'Paper',
      desc: '인쇄물 감성의 클린 페이퍼 & 미니멀 흑백(#111111)',
      vars: {
        '--ds-primary': '#111111',
        '--ds-primary-hover': '#333333',
        '--ds-secondary': '#F3F4F6',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FAF9F6',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F3F2EE',
        '--ds-text': '#111827',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#E5E4DF',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '4px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 1px 2px rgba(0, 0, 0, 0.04)',
        '--ds-font-body': "'Roboto', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Montserrat', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'perspective',
      name: 'Perspective',
      desc: '에메랄드(#00BD7D) + 3D 공간 깊이 & 레이어드 입체감',
      vars: {
        '--ds-primary': '#00BD7D',
        '--ds-primary-hover': '#009E68',
        '--ds-secondary': '#E6F9F2',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#F3F7F6',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#EBF3F1',
        '--ds-text': '#111827',
        '--ds-text-muted': '#4B5563',
        '--ds-border': '#D1E5DF',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '14px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 14px 30px -8px rgba(0, 189, 125, 0.18), 0 4px 10px rgba(17, 24, 39, 0.06)',
        '--ds-font-body': "'Poppins', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Oswald', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'power',
      name: 'Power',
      desc: '블랙(#000) 다크 모노크롬 & Oswald 볼드 빅 헤딩',
      vars: {
        '--ds-primary': '#FAFAFA',
        '--ds-primary-hover': '#E4E4E7',
        '--ds-secondary': '#27272A',
        '--ds-on-primary': '#000000',
        '--ds-bg': '#000000',
        '--ds-surface': '#0A0A0A',
        '--ds-surface-muted': '#18181B',
        '--ds-text': '#FFFFFF',
        '--ds-text-muted': '#A1A1AA',
        '--ds-border': '#27272A',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '8px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 8px 24px rgba(0, 0, 0, 0.6)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Oswald', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      desc: 'Apple 감성의 정밀한 여백, Inter 타이포 & 글래스 터치',
      vars: {
        '--ds-primary': '#3B82F6',
        '--ds-primary-hover': '#2563EB',
        '--ds-secondary': '#EFF6FF',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#F5F5F7',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F2F2F5',
        '--ds-text': '#111827',
        '--ds-text-muted': '#6E6E73',
        '--ds-border': '#E5E5EA',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '18px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 4px 20px rgba(0, 0, 0, 0.04)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      desc: '비즈니스 옐로우(#FECE14) + 블랙 대비 & Poppins 구조',
      vars: {
        '--ds-primary': '#FECE14',
        '--ds-primary-hover': '#EAB308',
        '--ds-secondary': '#FEF9C3',
        '--ds-on-primary': '#111827',
        '--ds-bg': '#F8FAFC',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F1F5F9',
        '--ds-text': '#111827',
        '--ds-text-muted': '#475569',
        '--ds-border': '#CBD5E1',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '8px',
        '--ds-radius-pill': '8px',
        '--ds-shadow': '0 1px 3px rgba(15, 23, 42, 0.08)',
        '--ds-font-body': "'Poppins', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Poppins', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'pulsed',
      name: 'Pulsed',
      desc: '바이브런트 오렌지(#EA580B) + 두꺼운 4px 보더 & Limelight',
      vars: {
        '--ds-primary': '#EA580B',
        '--ds-primary-hover': '#C2410C',
        '--ds-secondary': '#FDBA74',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FFEDD5',
        '--ds-surface': '#FFF7ED',
        '--ds-surface-muted': '#FED7AA',
        '--ds-text': '#9A3412',
        '--ds-text-muted': '#C2410C',
        '--ds-border': '#EA580B',
        '--ds-border-width': '4px',
        '--ds-border-style': 'solid',
        '--ds-radius': '14px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '4px 4px 0px #EA580B',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Limelight', 'Noto Serif KR', cursive"
      }
    },
    {
      id: 'refined',
      name: 'Refined',
      desc: 'Playfair Display 세리프 & 절제된 모던 미니멀',
      vars: {
        '--ds-primary': '#3B82F6',
        '--ds-primary-hover': '#2563EB',
        '--ds-secondary': '#EEF2FF',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FAFAFA',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F3F4F6',
        '--ds-text': '#111827',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#E5E7EB',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '8px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 1px 2px rgba(17, 24, 39, 0.04)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Playfair Display', 'Noto Serif KR', Georgia, serif"
      }
    },
    {
      id: 'retro',
      name: 'Retro',
      desc: 'Macondo 빈티지 타이포 & 고대비 레트로 팔레트',
      vars: {
        '--ds-primary': '#D97706',
        '--ds-primary-hover': '#B45309',
        '--ds-secondary': '#FEF3C7',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FDF6E3',
        '--ds-surface': '#FFFBEB',
        '--ds-surface-muted': '#FDE68A',
        '--ds-text': '#292524',
        '--ds-text-muted': '#78716C',
        '--ds-border': '#292524',
        '--ds-border-width': '2px',
        '--ds-border-style': 'solid',
        '--ds-radius': '6px',
        '--ds-radius-pill': '6px',
        '--ds-shadow': '3px 3px 0px #292524',
        '--ds-font-body': "'JetBrains Mono', 'Noto Sans KR', monospace",
        '--ds-font-display': "'Macondo', 'Noto Serif KR', cursive"
      }
    },
    {
      id: 'riso',
      name: 'Riso',
      desc: '미색 종이 + 형광 핑크 & 페더럴 블루 오프셋 인쇄',
      vars: {
        '--ds-primary': '#F237A1',
        '--ds-primary-hover': '#D81B87',
        '--ds-secondary': '#FCE7F3',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FAF6EE',
        '--ds-surface': '#FFFDF8',
        '--ds-surface-muted': '#F3EDE0',
        '--ds-text': '#2C40A7',
        '--ds-text-muted': '#5565B8',
        '--ds-border': '#2C40A7',
        '--ds-border-width': '2px',
        '--ds-border-style': 'solid',
        '--ds-radius': '4px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '4px 4px 0px #2C40A7',
        '--ds-font-body': "'Space Grotesk', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Space Grotesk', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'roku',
      name: 'Roku',
      desc: '보라색(#9333EA) 글래스 패널 & 대시보드 미학',
      vars: {
        '--ds-primary': '#9333EA',
        '--ds-primary-hover': '#7E22CE',
        '--ds-secondary': '#F3E8FF',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FAF5FF',
        '--ds-surface': 'rgba(255, 255, 255, 0.88)',
        '--ds-surface-muted': '#F3E8FF',
        '--ds-text': '#09090B',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#E9D5FF',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '14px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 8px 24px -4px rgba(147, 51, 234, 0.14)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'sega',
      name: 'Sega',
      desc: 'VT323 픽셀 폰트, 0px 각진 모서리 & 아케이드 블록',
      vars: {
        '--ds-primary': '#4502FF',
        '--ds-primary-hover': '#3500CC',
        '--ds-secondary': '#FFDA14',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#F4F4F5',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#FFDA14',
        '--ds-text': '#111827',
        '--ds-text-muted': '#374151',
        '--ds-border': '#111827',
        '--ds-border-width': '3px',
        '--ds-border-style': 'solid',
        '--ds-radius': '0px',
        '--ds-radius-pill': '0px',
        '--ds-shadow': '4px 4px 0px #4502FF, 7px 7px 0px #FFDA14',
        '--ds-font-body': "'VT323', 'Noto Sans KR', monospace",
        '--ds-font-display': "'VT323', 'Noto Sans KR', monospace"
      }
    },
    {
      id: 'shadcn',
      name: 'Shadcn',
      desc: 'Geist 모노크롬(#000) & 절제된 유틸리티 컴포넌트',
      vars: {
        '--ds-primary': '#18181B',
        '--ds-primary-hover': '#27272A',
        '--ds-secondary': '#F4F4F5',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FFFFFF',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F4F4F5',
        '--ds-text': '#09090B',
        '--ds-text-muted': '#71717A',
        '--ds-border': '#E4E4E7',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '8px',
        '--ds-radius-pill': '6px',
        '--ds-shadow': '0 1px 2px rgba(0, 0, 0, 0.05)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'sketch',
      name: 'Sketch',
      desc: '크림 종이(#F4EDE0) + 소프트 틸(#1DAD97) & 점선 손그림',
      vars: {
        '--ds-primary': '#1DAD97',
        '--ds-primary-hover': '#168F7C',
        '--ds-secondary': '#E6F7F4',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#F4EDE0',
        '--ds-surface': '#FFFDF9',
        '--ds-surface-muted': '#EAE0CE',
        '--ds-text': '#1F2937',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#374151',
        '--ds-border-width': '2px',
        '--ds-border-style': 'dashed',
        '--ds-radius': '14px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '3px 4px 0px #374151',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Delicious Handrawn', 'Noto Sans KR', cursive"
      }
    },
    {
      id: 'skeumorphism',
      name: 'Skeumorphism',
      desc: '3D 입체 베벨, 실물 질감 & 오렌지(#FA3C00) 촉감 UI',
      vars: {
        '--ds-primary': '#FA3C00',
        '--ds-primary-hover': '#D93400',
        '--ds-secondary': '#FFF0EB',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#E5E7EB',
        '--ds-surface': '#F9FAFB',
        '--ds-surface-muted': '#D1D5DB',
        '--ds-text': '#111827',
        '--ds-text-muted': '#4B5563',
        '--ds-border': '#9CA3AF',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '10px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 4px 6px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        '--ds-font-body': "'Roboto', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Germania One', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'sleek',
      name: 'Sleek',
      desc: '8pt 그리드, 60-30-10 컬러 & 매끄러운 미니멀리즘',
      vars: {
        '--ds-primary': '#3B82F6',
        '--ds-primary-hover': '#2563EB',
        '--ds-secondary': '#EFF6FF',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#F8FAFC',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F1F5F9',
        '--ds-text': '#0F172A',
        '--ds-text-muted': '#64748B',
        '--ds-border': '#E2E8F0',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '12px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 2px 8px rgba(15, 23, 42, 0.05)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'spacious',
      name: 'Spacious',
      desc: '넉넉한 여백(Whitespace) & 44px+ 접근성 터치 타겟',
      vars: {
        '--ds-primary': '#2563EB',
        '--ds-primary-hover': '#1D4ED8',
        '--ds-secondary': '#DBEAFE',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FFFFFF',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F8FAFC',
        '--ds-text': '#111827',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#E5E7EB',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '16px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 4px 16px rgba(0, 0, 0, 0.04)',
        '--ds-font-body': "'Open Sans', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Montserrat', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'square',
      name: 'Square',
      desc: '직각 지오메트릭 레이아웃 & 섬세한 타이포그래피',
      vars: {
        '--ds-primary': '#111827',
        '--ds-primary-hover': '#374151',
        '--ds-secondary': '#F3F4F6',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FFFFFF',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#F9FAFB',
        '--ds-text': '#111827',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#D1D5DB',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '0px',
        '--ds-radius-pill': '0px',
        '--ds-shadow': 'none',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Inter', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'stitch',
      name: 'Stitch',
      desc: '다크 틸(#072C2C) + 오렌지(#FF5F03) & 크림 서피스(#EDEADE)',
      vars: {
        '--ds-primary': '#FF5F03',
        '--ds-primary-hover': '#E05200',
        '--ds-secondary': '#072C2C',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#EDEADE',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#E4E0D2',
        '--ds-text': '#072C2C',
        '--ds-text-muted': '#4B5E5E',
        '--ds-border': '#C9C4B5',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '8px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 2px 6px rgba(7, 44, 44, 0.08)',
        '--ds-font-body': "'Ubuntu', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Oswald', 'Noto Sans KR', sans-serif"
      }
    },
    {
      id: 'storytelling',
      name: 'Storytelling',
      desc: 'Abril Fatface 감성 디스플레이 & 내러티브 중심 흐름',
      vars: {
        '--ds-primary': '#8B5CF6',
        '--ds-primary-hover': '#7C3AED',
        '--ds-secondary': '#F5F3FF',
        '--ds-on-primary': '#ffffff',
        '--ds-bg': '#FFFDFB',
        '--ds-surface': '#FFFFFF',
        '--ds-surface-muted': '#FAF5FF',
        '--ds-text': '#1F2937',
        '--ds-text-muted': '#6B7280',
        '--ds-border': '#EDE9FE',
        '--ds-border-width': '1px',
        '--ds-border-style': 'solid',
        '--ds-radius': '18px',
        '--ds-radius-pill': '9999px',
        '--ds-shadow': '0 10px 25px -5px rgba(139, 92, 246, 0.1)',
        '--ds-font-body': "'Inter', 'Noto Sans KR', sans-serif",
        '--ds-font-display': "'Abril Fatface', 'Noto Serif KR', serif"
      }
    }
  ];

  function getSavedDesignSkillId() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && DESIGN_SKILLS.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'default';
  }

  function applyDesignSkill(skillId) {
    const skill = DESIGN_SKILLS.find((s) => s.id === skillId) || DESIGN_SKILLS[0];
    const root = document.documentElement;
    root.setAttribute('data-design-skill', skill.id);

    Object.entries(skill.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    try {
      localStorage.setItem(THEME_STORAGE_KEY, skill.id);
    } catch {
      // ignore
    }
    return skill;
  }

  // 초기 즉시 적용 (FOUC 최소화)
  applyDesignSkill(getSavedDesignSkillId());

  window.Hobak = Object.assign(window.Hobak || {}, {
    DESIGN_SKILLS,
    getSavedDesignSkillId,
    applyDesignSkill
  });
})();
