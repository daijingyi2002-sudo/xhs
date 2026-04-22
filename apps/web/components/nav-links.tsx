import Link from "next/link";

const links = [
  { href: "/", label: "首页" },
  { href: "/jobs", label: "岗位线索" },
  { href: "/plaza", label: "职场广场" },
  { href: "/resume-lab", label: "简历实验室" },
  { href: "/history", label: "历史记录" },
  { href: "/admin", label: "看板" }
];

export function NavLinks() {
  return (
    <nav className="top-nav" aria-label="Primary">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
