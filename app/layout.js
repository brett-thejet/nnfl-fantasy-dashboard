export const metadata = { title: 'NNFL Fantasy Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0,fontFamily:'system-ui',background:'#0b1020',color:'#e6f0ff'}}>
        <nav style={{display:'flex',gap:'1rem',padding:'1rem',borderBottom:'1px solid #243'}}>
          <a href="/" style={{color:'#a8caff'}}>Home</a>
          <a href="/teams" style={{color:'#a8caff'}}>Teams</a>
          <a href="/faab" style={{color:'#a8caff'}}>FAAB</a>
        </nav>
        <main style={{maxWidth:960,margin:'2rem auto',padding:'0 1rem'}}>{children}</main>
      </body>
    </html>
  );
}
