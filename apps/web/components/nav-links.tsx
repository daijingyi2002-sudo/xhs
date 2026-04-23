import Link from "next/link";

const links = [
  { href: "/", label: "首页" },
  { href: "/jobs", label: "职位" },
  { href: "/interview/demo", label: "模拟面试" },
  { href: "/resume-lab", label: "简历实验室" },
  { href: "/plaza", label: "广场" },
  { href: "/history", label: "历史" }
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
