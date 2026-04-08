import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 py-12">
            <div className="max-w-5xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                      <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                      <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                      <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-sm">TaskFlow</span>
                  <span className="text-zinc-700 text-xs">· Built with Go & Next.js</span>
                </div>
    
                <div className="flex items-center gap-6">
                  {["Features", "How it works", "Sign in", "Register"].map((link) => (
                    <a key={link}
                      href={link === "Sign in" ? "/auth/login" : link === "Register" ? "/auth/register" : `#${link.toLowerCase().replace(/ /g, "-")}`}
                      className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
    
                <p className="text-zinc-800 text-xs">© {new Date().getFullYear()} TaskFlow</p>
              </div>
            </div>
          </footer>
  )
}
