import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const LegalPage = ({ fileName }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    // Dynamické načtení .md souboru ze složky
    import(`../legal/${fileName}.md`)
      .then(res => fetch(res.default))
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error("Chyba při načítání dokumentu:", err));
  }, [fileName]);

  return (
    <div className="legal-container">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default LegalPage;