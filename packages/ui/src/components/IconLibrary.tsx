/**
 * @lkvip/ui — IconLibrary
 *
 * Central re-export of every Lucide icon used across the LKVIP ecosystem.
 * Import icons from here instead of directly from 'lucide-react' in individual
 * components so that:
 *   1. We guarantee one Lucide version is ever bundled per app.
 *   2. Icon names are searchable in one place.
 *   3. Adding/swapping icons is a single-file change.
 *
 * Usage:
 *   import { IconHeart, IconTrendingUp, IconSpinner } from '@lkvip/ui';
 *
 * All exports are named with an "Icon" prefix to prevent clashes with
 * component names (e.g. Heart could be a dating component name).
 */

export {
  // ── Navigation ──────────────────────────────────────────────────────────
  Home         as IconHome,
  ChevronLeft  as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronDown  as IconChevronDown,
  ChevronUp    as IconChevronUp,
  ArrowLeft    as IconArrowLeft,
  ArrowRight   as IconArrowRight,
  ArrowUpRight as IconArrowUpRight,
  ArrowDownRight as IconArrowDownRight,
  Menu         as IconMenu,
  MoreHorizontal as IconMoreHorizontal,
  ExternalLink as IconExternalLink,

  // ── Actions ─────────────────────────────────────────────────────────────
  Plus         as IconPlus,
  Trash2       as IconTrash,
  Edit         as IconEdit,
  Edit2        as IconEdit2,
  Copy         as IconCopy,
  Check        as IconCheck,
  X            as IconX,
  Search       as IconSearch,
  Upload       as IconUpload,
  Download     as IconDownload,
  Send         as IconSend,
  RefreshCw    as IconRefresh,
  RotateCw     as IconRotate,

  // ── State / Feedback ────────────────────────────────────────────────────
  CheckCircle  as IconCheckCircle,
  CheckCircle2 as IconCheckCircle2,
  AlertCircle  as IconAlertCircle,
  AlertTriangle as IconAlertTriangle,
  Info         as IconInfo,
  HelpCircle   as IconHelpCircle,
  Loader2      as IconLoader,
  Eye          as IconEye,
  EyeOff       as IconEyeOff,

  // ── Auth / Security ─────────────────────────────────────────────────────
  Lock         as IconLock,
  Shield       as IconShield,
  ShieldCheck  as IconShieldCheck,
  ShieldAlert  as IconShieldAlert,
  KeyRound     as IconKey,
  LogIn        as IconLogIn,
  LogOut       as IconLogOut,

  // ── Finance ─────────────────────────────────────────────────────────────
  Wallet       as IconWallet,
  CreditCard   as IconCreditCard,
  DollarSign   as IconDollar,
  TrendingUp   as IconTrendingUp,
  TrendingDown as IconTrendingDown,
  BarChart2    as IconBarChart,
  BarChart3    as IconBarChart3,
  LineChart    as IconLineChart,
  PiggyBank    as IconPiggyBank,
  Landmark     as IconBank,
  Bitcoin      as IconBitcoin,
  ArrowUpCircle as IconArrowUpCircle,
  ArrowDownCircle as IconArrowDownCircle,

  // ── Social / Community ──────────────────────────────────────────────────
  Heart        as IconHeart,
  Star         as IconStar,
  MessageCircle as IconMessageCircle,
  MessageSquare as IconMessageSquare,
  Share2       as IconShare,
  Users        as IconUsers,
  User         as IconUser,
  UserCheck    as IconUserCheck,
  Crown        as IconCrown,
  Trophy       as IconTrophy,
  Flame        as IconFlame,
  Sparkles     as IconSparkles,

  // ── Dating ──────────────────────────────────────────────────────────────
  Camera       as IconCamera,
  CameraOff    as IconCameraOff,
  Smile        as IconSmile,

  // ── Media / Content ─────────────────────────────────────────────────────
  Play         as IconPlay,
  Pause        as IconPause,
  Video        as IconVideo,
  Volume2      as IconVolume,
  VolumeX      as IconVolumeOff,
  Mic          as IconMic,
  MicOff       as IconMicOff,
  Music        as IconMusic,
  Image        as IconImage,

  // ── Communication ───────────────────────────────────────────────────────
  Bell         as IconBell,
  Mail         as IconMail,
  Phone        as IconPhone,
  PhoneOff     as IconPhoneOff,
  Headphones   as IconHeadphones,
  Megaphone    as IconMegaphone,
  Radio        as IconRadio,

  // ── Sports ──────────────────────────────────────────────────────────────
  Activity     as IconActivity,
  Calendar     as IconCalendar,
  Clock        as IconClock,
  Clock4       as IconClock4,
  Tv           as IconTv,
  Newspaper    as IconNewspaper,
  Download     as IconDownload2,
  Search       as IconSearch2,

  // ── System / Settings ───────────────────────────────────────────────────
  Settings     as IconSettings,
  Settings2    as IconSettings2,
  SlidersHorizontal as IconSliders,
  Cpu          as IconCpu,
  Server       as IconServer,
  Wifi         as IconWifi,
  WifiOff      as IconWifiOff,
  Network      as IconNetwork,
  Smartphone   as IconSmartphone,
  PlugZap      as IconPlug,
  Wrench       as IconWrench,
  Bot          as IconBot,
  Layers       as IconLayers,
  Languages    as IconLanguages,
  Sun          as IconSun,
  Moon         as IconMoon,

  // ── File / Folder ───────────────────────────────────────────────────────
  FolderOpen   as IconFolder,
  Package      as IconPackage,
  PackageOpen  as IconPackageOpen,
  PackageSearch as IconPackageSearch,
  BookOpen     as IconBook,
  News         as IconNews,
  Inbox        as IconInbox,

  // ── Gift / Reward ───────────────────────────────────────────────────────
  Gift         as IconGift,
  Zap          as IconZap,
  Briefcase    as IconBriefcase,
  GraduationCap as IconGraduationCap,
  Navigation   as IconNavigation,
  Grid3X3      as IconGrid,
  Link         as IconLink,
  History      as IconHistory,
  Building2    as IconBuilding,
  Ruler        as IconRuler,
  FileText     as IconFileText,
  ScrollText   as IconScrollText,
  Trophy       as IconTrophy2,
  Sparkles     as IconSparkles2,

} from 'lucide-react';

// ── Type re-export (allows `typeof IconHeart` for prop typing) ──────────────
export type { LucideIcon, LucideProps } from 'lucide-react';
