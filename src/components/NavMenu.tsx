import Link from "next/link";

type NavLabels = {
  news: string;
  week: string;
  trending: string;
  tutos: string;
  glossary: string;
  sources: string;
  about: string;
};

export function NavMenu({ labels }: { labels: NavLabels }) {
  const links = [
    { href: "/actus", label: labels.news },
    { href: "/cette-semaine", label: labels.week },
    { href: "/trending", label: labels.trending },
    { href: "/tutos", label: labels.tutos },
    { href: "/glossaire", label: labels.glossary },
    { href: "/sources", label: labels.sources },
    { href: "/a-propos", label: labels.about },
  ];

  return (
    <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-6">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="mainnav-link whitespace-nowrap">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
