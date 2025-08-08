export default function Card({ title, children }) {
  return (
    <section style={{background:'#151a30',border:'1px solid #243',borderRadius:12,padding:'1rem',marginBottom:'1rem'}}>
      {title && <h2 style={{margin:'0 0 .5rem'}}>{title}</h2>}
      {children}
    </section>
  );
}
