import { site, contacts, regionsAll } from '../config/site';

const isFilled = (v: string) => !!v && !v.includes('ЗАПОЛНИТЬ') && !v.includes('ZAPOLNIT') && !v.includes('70000000000') && !v.includes('example.ru');

/** Разметка Schema.org LegalService — только реальные данные (незаполненные поля пропускаются). */
export function legalServiceLd(siteUrl: URL) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: site.brand,
    url: siteUrl.href,
    description: 'Составление исков, ходатайств, заявлений, жалоб и обращений в органы, правовая экспертиза документов и ситуаций. Работа полностью онлайн.',
    priceRange: `от ${site.priceFromNumber} ₽`,
    currenciesAccepted: 'RUB',
    areaServed: regionsAll.map((name) => ({ '@type': 'AdministrativeArea', name })),
    availableChannel: { '@type': 'ServiceChannel', name: 'Онлайн: мессенджеры, телефон, e-mail' },
    image: new URL('/og.png', siteUrl).href,
  };
  const phone = contacts.phoneHref.replace('tel:', '');
  if (isFilled(phone)) ld.telephone = phone;
  const email = contacts.email.replace('mailto:', '');
  if (isFilled(email)) ld.email = email;
  const sameAs = [contacts.telegram].filter(isFilled);
  if (sameAs.length) ld.sameAs = sameAs;
  return ld;
}
