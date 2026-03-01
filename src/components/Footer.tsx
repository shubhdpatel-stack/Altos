const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            Pre-Coordinated Trajectory Deconfliction System — Concept Note
          </p>
          <p className="text-muted-foreground text-xs font-mono">
            For discussion purposes only. Not an operational specification.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
