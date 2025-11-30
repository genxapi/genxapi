export type NavItem = {
  title: string;
  href?: string;
  external?: boolean;
  children?: NavItem[];
};

export function getNav(): NavItem[] {
  return [
    {
      title: "Getting Started",
      href: "/docs/getting-started"
    },
    {
      title: "Configuration",
      children: [
        { title: "Overview", href: "/docs/configuration" },
        { title: "Unified generator config", href: "/docs/configuration/unified-generator-config" }
      ]
    },
    {
      title: "Templates",
      children: [
        { title: "Overview", href: "/docs/templates" },
        { title: "Orval template", href: "/docs/templates/orval-api-client-template" },
        { title: "Kubb template", href: "/docs/templates/kubb-api-client-template" }
      ]
    },
    { title: "CI integration", href: "/docs/ci-integration" },
    { title: "Versioning & releases", href: "/docs/versioning" },
    {
      title: "Context & roadmap",
      children: [
        { title: "Scope", href: "/docs/scope" },
        { title: "Context", href: "/docs/context" },
        { title: "Next steps", href: "/docs/next-steps" }
      ]
    },
    { title: "Contributing", href: "/docs/contributing" },
    {
      title: "Samples",
      href: "https://github.com/genxapi/genxapi/tree/main/samples",
      external: true
    }
  ];
}
