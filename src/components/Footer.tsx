const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            Altos — Advanced Low Altitude Traffic Operation System
          </p>
          <p className="text-muted-foreground text-xs font-mono">
            © {new Date().getFullYear()} Altos. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
