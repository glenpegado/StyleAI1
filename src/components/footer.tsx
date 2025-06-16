import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-gray-500 text-sm">
            © {currentYear} Urban Stylist AI
          </div>
        </div>
      </div>
    </footer>
  );
}
