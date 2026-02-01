import { Link } from "wouter";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold">ArtMatch AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The trust-driven, AI-powered marketplace connecting art lovers with verified artworks.
            </p>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold mb-4">Discover</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/discover" className="hover:text-foreground transition-colors">
                  Browse Artworks
                </Link>
              </li>
              <li>
                <Link href="/discover?style=contemporary" className="hover:text-foreground transition-colors">
                  Contemporary Art
                </Link>
              </li>
              <li>
                <Link href="/discover?style=abstract" className="hover:text-foreground transition-colors">
                  Abstract Art
                </Link>
              </li>
              <li>
                <Link href="/discover?medium=painting" className="hover:text-foreground transition-colors">
                  Paintings
                </Link>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold mb-4">For Sellers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/create-listing" className="hover:text-foreground transition-colors">
                  List Your Art
                </Link>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Pricing Guide
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Seller Verification
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Success Stories
                </span>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="font-semibold mb-4">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  How It Works
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Provenance Verification
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Secure Payments
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Buyer Protection
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ArtMatch AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Contact
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
