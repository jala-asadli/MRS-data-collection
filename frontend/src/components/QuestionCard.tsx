import { type FC } from 'react';
import type { QuestionOption, QuizQuestion } from '../types';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}

const R_IMAGE_DESCRIPTIONS: Record<string, string> = {
  R1: 'Mexanik emalatxanada avtomobil mühərrikini təmir edir.',
  R2: 'Dülgər tikinti sahəsində taxta şüaları kəsir.',
  R3: 'Qaynaqçı zavodda metal qılınclarla birləşdirir.',
  R4: 'Təyyarə texniki mühərriki yoxlayır.',
  R5: 'Ağır texnika operatoru ekskavator idarə edir.',
  R6: 'Fermer açıq sahədə məhsul yığır.',
  R7: 'Park rəisi məşq yolunda avadanlıqları yoxlayır.',
  R8: 'Robototexnika texniki robot qolunu tənzimləyir.',
  R9: 'Yanğınsöndürən şlanq və avadanlarla məşq edir.',
  R10: 'Sənaye işçisi böyük maşını idarə edir.',
  R11: 'IT avadanlıq texniki kompüter hissalarını yığır.',
  R12: 'Landşafer elektrik avadanlığı ilə otları kəsir.',
  R13: 'Santexnik mətbəx dərinliyinin borularını təmir edir.',
  R14: 'Elektrikçi açar lövhəsinə naqilləri quraşdırır.',
  R15: 'İdmançı idman zalında ağırlıqları qaldırır.'
};

const I_IMAGE_DESCRIPTIONS: Record<string, string> = {
  I1: 'Alim laboratoriyada mikroskopik nümunəni analiz edir.',
  I2: 'Kimyaçı şüşə qabda mayeni diqqətlə ölçür.',
  I3: 'Tibbi tədqiqatçı kompüterdə test nəticələrini nəzərdən keçirir.',
  I4: 'Fizik tədqiqat laboratoriyasında təcrübə avadanlığını tənzimləyir.',
  I5: 'Data alimi çoxlu ekranlarda böyük məlumat dəstini araşdırır.',
  I6: 'Kiber təhlükəsizlik analitiki şübhəli şəbəkə fəaliyyətini araşdırır.',
  I7: 'Proqramçı səssiz iş məkanında mürəkkəb kodu səhvlərdən təmizləyir (debug edir).',
  I8: 'Məhkəmə-tədqiqat işçisi sübutları böyüdücü alət altında yoxlayır.',
  I9: 'Süni intellekt tədqiqatçısı machine learning modelinin nəticələrini nəzərdən keçirir.',
  I10: 'Riyaziyyatçı kitabxana lövhədə mürəkkəb tənlikləri həll edir.',
  I11: 'Tədqiqatçı akademik məqalələri nəzərdən keçirərkən qeydlər aparır.',
  I12: 'Siyasət analitiki sənədləri nəzərdən keçirir və əsas hissələri qeyd edir.',
  I13: 'Ətraf mühit alimi çaydan su nümunələri götürür.',
  I14: 'Detektiv fotoşəkillər və alaqalan olan iş lövhəsini təhlil edir.',
  I15: 'Vəhşi təbiət tədqiqatçısı heyvanları müşahidə edir və məlumatları qeyd alır.'
};

const A_IMAGE_DESCRIPTIONS: Record<string, string> = {
  A1: 'Rəssam studiyada böyük abstrakt lövhə üzərində işləiyr.',
  A2: 'İllüstrator dəftərdə təsəvvürə əsaslanan səhnə sketç edir.',
  A3: 'Heykəltəraş əllə gil fiqur formalaşdırır.',
  A4: 'Yaradıcı mütəxəssis mood board və eskizlərlə ideya beyin fırtınası edir.',
  A5: 'Divar rəssamı böyük ifadəli divar əsərini rəngləyir.',
  A6: 'Video redaktoru emosional səhnənin zaman cədvəlini hazırlayır.',
  A7: 'Animator ekranda fantaziya xarakteri dizayn edir.',
  A8: 'UX dizayneri planlaşdırma sketçlərini planşetdə yaradıcı şəkildə çəkir.',
  A9: 'Aktrisa səhnədə dramatik monoloqu məşq edir.',
  A10: 'Musiqiçi gitar üzərində orijinal melodiyanın başlayır.',
  A11: 'Ssenarist kağızlarla örtülmüş divarda ideyaları beyin fırtınası edir.',
  A12: 'Rəqqas ifadəli müasir xoreoqrafiyanı məşq edir.',
  A13: 'Şair pəncərə yanında dəftərdə yazır.',
  A14: 'Oyun dizayneri yeni dünya üçün konsept sənəti çəkir.',
  A15: 'Yazıçı sakit və düşüncəli məkanda hekayə layihləndirir.'
};

const S_IMAGE_DESCRIPTIONS: Record<string, string> = {
  S1: 'Müəllim dərsi maraqla dinləyən şagirdlərlə dolu sinifə izah edir.',
  S2: 'Məktəb psixoloqu yeniyetmə şagirdlə təkbətək söhbət edir.',
  S3: 'Tibb bacısı xəstəxana otağında pasiyentlə maraqlanır.',
  S4: 'Fizioterapevt pasiyentə reabilitasiya məşqi zamanı kömək edir.',
  S5: 'Loqoped uşaqla tələffüz məşqi edir.',
  S6: 'Sosial işçi evdə ailə ilə dəstək planının müzakirə edir.',
  S7: 'Könüllü icma mərkəzində ailəyə ərzaq bağlaması təqdim edir.',
  S8: 'Moderator dairəvi şəkildə oturmuş kiçik dəstək qrupuna rəhbərlik edir.',
  S9: 'Universitet məsləhətçisi tələbəyə akademik cədvəlin planlaşdırmada kömək edir.',
  S10: 'Mentor gənc peşəkarla dəstəkləyici söhbət aparır.',
  S11: 'Sağlamlıq təlimçisi kiçik icma qrupuna sağlamlıq haqqında məlumat təqdim edir.',
  S12: 'Reabilitasiya məsləhətçisi müştəri ilə irəliləyişi müzakirə edir.',
  S13: 'İcma əlaqələri üzrə işçi yerli sakinlə resursları müzakirə edir.',
  S14: 'Məşqçi məşq zamanı gənc idmançını təşviq edir.',
  S15: 'Krizis xətti işçisi səssiz ofisdə qulaqlıqla diqqətlə dinləyir.'
};

const E_IMAGE_DESCRIPTIONS: Record<string, string> = {
  E1: 'İcraçı komandasına biznes strategiyasını təqdim edir.',
  E2: 'Layihə meneceri komanda planlaşdırma sessiyasına rəhbərlik edir.',
  E3: 'Baş icraçı direktor müasir ofis mühitində komandaya müraciət edir.',
  E4: 'İşə qəbul üzrə mütəxəssis ofisdə iş namizədi ilə inamla müsahibə aparır.',
  E5: 'Biznes danışıqçısı müqavilə imzalandıqdan sonra əl sıxır.',
  E6: 'Siyasi namizəd böyük açıq hava kütləsinə inamla müraciət edir.',
  E7: 'Marketinq direktoru komanda ilə yaradıcı kampaniya müzakirəsinə rəhbərlik edir.',
  E8: 'Vəkil hakim qarşısında arqumentlərini inamla təqdim edir.',
  E9: 'Restoran sahibi məşğul növbə zamanı heyəti inamla idarə edir.',
  E10: 'Sahibkar təqdimat tədbirində yeni məhsulu nümayiş etdirir.',
  E11: 'Biznes strategiyası komanda ilə performans qrafiklərini nəzərdən keçirir.',
  E12: 'Məhsul meneceri funksiyalararası komanda ilə yol xəritəsi görünüşü aparır.',
  E13: 'Qeyri-kommersiya direktoru könüllü qrupa açıq havada müraciət edir.',
  E14: 'İnamlı çıxışçı auditoriyada əsas nitqi təqdim edir.',
  E15: 'Kiçik butik sahibi mağazada müştəriləri salamlayır.'
};

const C_IMAGE_DESCRIPTIONS: Record<string, string> = {
  C1: 'Mühasib masada maliyyə cədvəllərini təhlil edir.',
  C2: 'Ofis administratoru sənəd şkafında kağız sənədləri təşkil edir.',
  C3: 'Uyğunluq üzrə məsul şəxs yoxlama siyahısı ilə siyasət təlimatını diqqətlə nəzərdən keçirir.',
  C4: 'Logistika koordinatoru sistemləşdirilmiş kompüter panelində göndərişləri izləyir.',
  C5: 'Tibbi sənədlər üzrə mütəxəssis pasiyent qovluqlarını fayl sistemində yerləşdirir.',
  C6: 'Ofis işçisi kompüterdə verilənlər bazası qeydlərini yeniləyir.',
  C7: 'Anbar işçisi məhsulları sistemləşdirilmiş anbar keçidində skan edir.',
  C8: 'Logistika koordinatoru sistemləşdirilmiş göndəriş izləmə ekranını izləyir.',
  C9: 'Köməkçi strukturulu təqvim sistemində görüşləri təşkil edir.',
  C10: 'IT mütəxəssisi müasir məlumat mərkəzində server rəflərini izləmək üçün planşetdən istifadə edir.',
  C11: 'Dövlət katibi standartlaşdırılmış müraciət formalarını nəzərdən keçirir və işləyir.',
  C12: 'Köməkçi strukturulu təqvim sistemində görüşləri təşkil edir.',
  C13: 'Keyfiyyət üzrə inspektor tamamlanmış vəzifələri yoxlama siyahısında işarələyir.',
  C14: 'Bank kassiri əməliyyat məlumatlarını aydın prosedura uyğun daxil edir.',
  C15: 'Hava limanı işçisi qapıda təyyarəyə minmə kartlarını çap edilmiş sərnişin siyahısı ilə yoxlayır.'
};

const getImageDescription = (imageUrl: string) => {
  const match = /image_(([RIASEC])\d+)\./i.exec(imageUrl || '');
  if (!match) return '';
  const key = match[1].toUpperCase();
  const letter = match[2].toUpperCase();
  if (letter === 'R') return R_IMAGE_DESCRIPTIONS[key] || '';
  if (letter === 'I') return I_IMAGE_DESCRIPTIONS[key] || '';
  if (letter === 'A') return A_IMAGE_DESCRIPTIONS[key] || '';
  if (letter === 'S') return S_IMAGE_DESCRIPTIONS[key] || '';
  if (letter === 'E') return E_IMAGE_DESCRIPTIONS[key] || '';
  if (letter === 'C') return C_IMAGE_DESCRIPTIONS[key] || '';
  return '';
};

export const QuestionCard: FC<QuestionCardProps> = ({ question, selectedOptionId, onSelect }) => {
  const optionTitle = (option: QuestionOption) => `${option.code} seçimi`;

  return (
    <section className="question-card quiz-question-card" aria-live="polite">
      <header className="question-header">
        <p className="question-subtitle">Sizə daha uyğun olan seçimi edin</p>
      </header>
      <div className="options-grid quiz-options-grid">
        {question.options.map((option) => {
          const shortDescription = getImageDescription(option.imageUrl);
          return (
            <button
              key={option.id}
              className="option-card"
              type="button"
              aria-pressed={selectedOptionId === option.id}
              data-selected={selectedOptionId === option.id}
              onClick={() => onSelect(option.id)}
            >
              <div className="option-media">
                <img src={`${import.meta.env.VITE_API_BASE}${option.imageUrl}`} alt={option.description} loading="lazy" />
                <span className="option-check" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
              <div className="option-meta">
                <span className="option-code">{option.code}</span>
                <h3>{optionTitle(option)}</h3>
                {shortDescription && <p className="option-brief">{shortDescription}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
