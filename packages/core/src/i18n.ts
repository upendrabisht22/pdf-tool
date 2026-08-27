/**
 * @file i18n.ts
 * @description Phase 8 — Comprehensive Internationalization (i18n) Engine.
 * Supports 6 core languages:
 *  - en: English (Default / Canonical)
 *  - es: Spanish (Español)
 *  - fr: French (Français)
 *  - de: German (Deutsch)
 *  - hi: Hindi (हिन्दी)
 *  - ja: Japanese (日本語)
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  'en',
  'es',
  'fr',
  'de',
  'hi',
  'ja',
] as const;

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMeta> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
};

export interface ToolI18nEntry {
  title: string;
  badge: string;
  subtitle: string;
  actionName: string;
}

export interface UiTranslations {
  nav: {
    tools: string;
    features: string;
    pricing: string;
    faq: string;
    getStarted: string;
  };
  hero: {
    dropPrompt: string;
    dropSubtext: string;
    selectFiles: string;
    addMore: string;
    processing: string;
    successTitle: string;
    downloadBtn: string;
    restartBtn: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    freeCoreName: string;
    byokAiName: string;
    supporterName: string;
    supportBtn: string;
    faqTitle: string;
  };
  tools: Record<string, ToolI18nEntry>;
}

export const TRANSLATIONS: Record<SupportedLocale, UiTranslations> = {
  en: {
    nav: {
      tools: 'PDF Tools',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      getStarted: 'Get Started Free',
    },
    hero: {
      dropPrompt: 'Drop your PDF files here',
      dropSubtext: 'or click to browse from your device',
      selectFiles: 'Select PDF Files',
      addMore: '+ Add more files',
      processing: 'Processing your document securely...',
      successTitle: 'Your document is ready!',
      downloadBtn: 'Download Processed File',
      restartBtn: 'Process Another Document',
    },
    pricing: {
      title: '100% Free Forever & Community Supported',
      subtitle: 'Zero paywalls, zero subscriptions, and zero forced signups. All core tools run in your browser for free.',
      freeCoreName: 'Free Core PDF ($0 Forever)',
      byokAiName: 'AI Intelligence (BYOK — Free)',
      supporterName: 'Community Supporter ($3+ Tip)',
      supportBtn: '☕ Support / Tip',
      faqTitle: 'Frequently Asked Questions',
    },
    tools: {
      'merge-pdf': {
        title: 'Merge PDF Online',
        badge: '100% Private Local Processing',
        subtitle: 'Combine multiple PDF files into one clean, high-resolution document in seconds.',
        actionName: 'Merge PDF Files',
      },
      'split-pdf': {
        title: 'Split PDF Online',
        badge: 'Extract & Separate Pages',
        subtitle: 'Separate PDF pages into standalone documents or extract custom page ranges.',
        actionName: 'Split PDF Document',
      },
      'compress-pdf': {
        title: 'Compress PDF Online',
        badge: 'Shrink File Size Without Quality Loss',
        subtitle: 'Reduce document size while maintaining crisp vector fonts and clear imagery.',
        actionName: 'Compress PDF Now',
      },
      'rotate-pdf': {
        title: 'Rotate PDF Online',
        badge: 'Permanent Page Orientation Fix',
        subtitle: 'Rotate portrait and landscape PDF pages 90, 180, or 270 degrees instantly.',
        actionName: 'Rotate Pages Now',
      },
      'delete-pdf-pages': {
        title: 'Delete PDF Pages Online',
        badge: 'Remove Unwanted Pages',
        subtitle: 'Selectively strip blank, redundant, or sensitive pages from any PDF document.',
        actionName: 'Delete Selected Pages',
      },
      'jpg-to-pdf': {
        title: 'Images to PDF Converter',
        badge: 'PNG, JPG & WEBP to PDF',
        subtitle: 'Convert image files into a clean, paginated, publication-ready PDF document.',
        actionName: 'Convert Images to PDF',
      },
      'pdf-to-jpg': {
        title: 'PDF to Image Converter',
        badge: 'High Resolution Render',
        subtitle: 'Convert each page of your PDF into crisp, individual PNG, JPG, or WEBP images.',
        actionName: 'Convert PDF to Images',
      },
      'word-to-pdf': {
        title: 'Word to PDF Converter',
        badge: 'DOCX & DOC Preservation',
        subtitle: 'Convert Microsoft Word documents to PDF with complete layout and typography fidelity.',
        actionName: 'Convert Word to PDF',
      },
      'excel-to-pdf': {
        title: 'Excel to PDF Converter',
        badge: 'XLSX & XLS Spreadsheets',
        subtitle: 'Convert financial spreadsheets and data sheets to crisp paginated PDF reports.',
        actionName: 'Convert Excel to PDF',
      },
      'pdf-to-word': {
        title: 'PDF to Word Converter',
        badge: 'Editable DOCX Reconstruction',
        subtitle: 'Reconstruct static PDF documents into fully editable Microsoft Word files.',
        actionName: 'Convert PDF to Word',
      },
      'pdf-to-excel': {
        title: 'PDF to Excel Converter',
        badge: 'Tabular Data Extraction',
        subtitle: 'Extract data tables from PDF reports directly into clean Microsoft Excel spreadsheets.',
        actionName: 'Convert PDF to Excel',
      },
      'watermark-pdf': {
        title: 'Watermark PDF Online',
        badge: 'Custom Text & Stamp Overlay',
        subtitle: 'Apply diagonal or centered copyright stamps, draft marks, or confidential notices.',
        actionName: 'Apply Watermark',
      },
      'protect-pdf': {
        title: 'Protect PDF Online',
        badge: 'AES-256 Encryption',
        subtitle: 'Lock your sensitive document with unbreakable passwords and custom permissions.',
        actionName: 'Encrypt & Protect PDF',
      },
      'unlock-pdf': {
        title: 'Unlock PDF Online',
        badge: 'Password Removal',
        subtitle: 'Permanently remove password restrictions from authorized documents.',
        actionName: 'Unlock PDF Document',
      },
      'redact-pdf': {
        title: 'Redact PDF Online',
        badge: 'Permanent PII Blackout',
        subtitle: 'Permanently remove sensitive numbers, names, and coordinates with zero-leak guarantees.',
        actionName: 'Permanently Redact PDF',
      },
      'ocr-pdf': {
        title: 'OCR PDF Online',
        badge: 'Searchable Sandwich PDF',
        subtitle: 'Optical Character Recognition: Convert scanned images into selectable, searchable text.',
        actionName: 'Run Optical Character Recognition',
      },
      'compare-pdf': {
        title: 'Compare PDF Documents',
        badge: 'Visual Difference Diff',
        subtitle: 'Highlight text, vector, and layout changes between two PDF revisions side-by-side.',
        actionName: 'Compare Revisions',
      },
      'ai-summarize': {
        title: 'AI Document Summarizer',
        badge: 'Executive Briefs & Action Items',
        subtitle: 'Extract executive summaries, key metrics, and action items using grounded AI intelligence.',
        actionName: 'Generate AI Summary',
      },
      'ai-ask': {
        title: 'Chat with PDF (AI Intelligence)',
        badge: 'Grounded RAG with Page Citations',
        subtitle: 'Ask deep factual questions about your document and get exact page-referenced answers.',
        actionName: 'Ask AI Intelligence',
      },
    },
  },

  es: {
    nav: {
      tools: 'Herramientas PDF',
      features: 'Características',
      pricing: 'Precios',
      faq: 'Preguntas Frecuentes',
      getStarted: 'Comenzar Gratis',
    },
    hero: {
      dropPrompt: 'Arrastra tus archivos PDF aquí',
      dropSubtext: 'o haz clic para explorar desde tu dispositivo',
      selectFiles: 'Seleccionar Archivos PDF',
      addMore: '+ Agregar más archivos',
      processing: 'Procesando tu documento de forma segura...',
      successTitle: '¡Tu documento está listo!',
      downloadBtn: 'Descargar Archivo Procesado',
      restartBtn: 'Procesar Otro Documento',
    },
    pricing: {
      title: '100% Gratis Para Siempre y Apoyado por la Comunidad',
      subtitle: 'Sin muros de pago, sin suscripciones y sin registros obligatorios. Todas las herramientas funcionan gratis.',
      freeCoreName: 'Herramientas PDF Básicas ($0)',
      byokAiName: 'Inteligencia IA (BYOK — Gratis)',
      supporterName: 'Apoyo a la Comunidad ($3+)',
      supportBtn: '☕ Apoyar / Propina',
      faqTitle: 'Preguntas Frecuentes',
    },
    tools: {
      'merge-pdf': {
        title: 'Unir PDF Online',
        badge: 'Procesamiento Local 100% Privado',
        subtitle: 'Combina múltiples archivos PDF en un documento limpio y de alta resolución en segundos.',
        actionName: 'Unir Archivos PDF',
      },
      'split-pdf': {
        title: 'Dividir PDF Online',
        badge: 'Extraer y Separar Páginas',
        subtitle: 'Separa páginas PDF en documentos independientes o extrae rangos personalizados.',
        actionName: 'Dividir Documento PDF',
      },
      'compress-pdf': {
        title: 'Comprimir PDF Online',
        badge: 'Reduce Tamaño Sin Perder Calidad',
        subtitle: 'Reduce el peso del archivo manteniendo fuentes vectoriales nítidas e imágenes claras.',
        actionName: 'Comprimir PDF Ahora',
      },
      'rotate-pdf': {
        title: 'Rotar PDF Online',
        badge: 'Ajuste Permanente de Orientación',
        subtitle: 'Gira páginas en vertical u horizontal a 90, 180 o 270 grados al instante.',
        actionName: 'Rotar Páginas Ahora',
      },
      'delete-pdf-pages': {
        title: 'Eliminar Páginas PDF Online',
        badge: 'Quitar Páginas Innecesarias',
        subtitle: 'Elimina de forma selectiva páginas en blanco, repetidas o confidenciales.',
        actionName: 'Eliminar Páginas Seleccionadas',
      },
      'jpg-to-pdf': {
        title: 'Convertidor de Imágenes a PDF',
        badge: 'PNG, JPG y WEBP a PDF',
        subtitle: 'Convierte tus imágenes en un documento PDF limpio y perfectamente paginado.',
        actionName: 'Convertir Imágenes a PDF',
      },
      'pdf-to-jpg': {
        title: 'Convertir PDF a Imagen',
        badge: 'Render de Alta Resolución',
        subtitle: 'Convierte cada página de tu PDF en imágenes nítidas en PNG, JPG o WEBP.',
        actionName: 'Convertir PDF a Imágenes',
      },
      'word-to-pdf': {
        title: 'Convertir Word a PDF',
        badge: 'Preservación de DOCX y DOC',
        subtitle: 'Convierte documentos de Microsoft Word a PDF con total fidelidad tipográfica y de diseño.',
        actionName: 'Convertir Word a PDF',
      },
      'excel-to-pdf': {
        title: 'Convertir Excel a PDF',
        badge: 'Hojas de Cálculo XLSX y XLS',
        subtitle: 'Convierte hojas de cálculo y tablas de datos en informes PDF listos para imprimir.',
        actionName: 'Convertir Excel a PDF',
      },
      'pdf-to-word': {
        title: 'Convertir PDF a Word',
        badge: 'Reconstrucción DOCX Editable',
        subtitle: 'Reconstruye documentos PDF estáticos en archivos de Microsoft Word totalmente editables.',
        actionName: 'Convertir PDF a Word',
      },
      'pdf-to-excel': {
        title: 'Convertir PDF a Excel',
        badge: 'Extracción de Datos Tabulares',
        subtitle: 'Extrae tablas de datos desde informes PDF directamente a hojas de cálculo de Excel.',
        actionName: 'Convertir PDF a Excel',
      },
      'watermark-pdf': {
        title: 'Marca de Agua en PDF Online',
        badge: 'Superposición de Texto y Sellos',
        subtitle: 'Aplica sellos de confidencialidad, marcas de borrador o avisos de derechos de autor.',
        actionName: 'Aplicar Marca de Agua',
      },
      'protect-pdf': {
        title: 'Proteger PDF Online',
        badge: 'Cifrado AES-256',
        subtitle: 'Protege tu documento confidencial con contraseñas seguras y permisos personalizados.',
        actionName: 'Cifrar y Proteger PDF',
      },
      'unlock-pdf': {
        title: 'Desbloquear PDF Online',
        badge: 'Eliminación de Contraseña',
        subtitle: 'Elimina permanentemente restricciones de contraseña en documentos autorizados.',
        actionName: 'Desbloquear Documento PDF',
      },
      'redact-pdf': {
        title: 'Censurar PDF Online',
        badge: 'Bloqueo Permanente de Datos',
        subtitle: 'Oculta permanentemente números de identidad, nombres y datos confidenciales con garantía total.',
        actionName: 'Censurar PDF Permanentemente',
      },
      'ocr-pdf': {
        title: 'OCR PDF Online',
        badge: 'PDF Sandwich con Búsqueda',
        subtitle: 'Reconocimiento Óptico de Caracteres: Convierte imágenes escaneadas en texto seleccionable.',
        actionName: 'Ejecutar Reconocimiento OCR',
      },
      'compare-pdf': {
        title: 'Comparar Documentos PDF',
        badge: 'Diferencia Visual Detallada',
        subtitle: 'Resalta cambios de texto, vectores y diseño entre dos revisiones PDF cara a cara.',
        actionName: 'Comparar Revisiones',
      },
      'ai-summarize': {
        title: 'Resumidor de Documentos con IA',
        badge: 'Resúmenes Ejecutivos y Métricas',
        subtitle: 'Extrae resúmenes ejecutivos y puntos clave utilizando inteligencia artificial avanzada.',
        actionName: 'Generar Resumen con IA',
      },
      'ai-ask': {
        title: 'Chatear con PDF (IA Documental)',
        badge: 'RAG con Citas de Página',
        subtitle: 'Haz preguntas fácticas sobre tu documento y obtén respuestas con números de página exactos.',
        actionName: 'Preguntar a la IA',
      },
    },
  },

  fr: {
    nav: {
      tools: 'Outils PDF',
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      faq: 'FAQ',
      getStarted: 'Commencer Gratuitement',
    },
    hero: {
      dropPrompt: 'Déposez vos fichiers PDF ici',
      dropSubtext: 'ou cliquez pour parcourir votre appareil',
      selectFiles: 'Sélectionner des Fichiers PDF',
      addMore: '+ Ajouter d’autres fichiers',
      processing: 'Traitement sécurisé de votre document...',
      successTitle: 'Votre document est prêt !',
      downloadBtn: 'Télécharger le Fichier Traité',
      restartBtn: 'Traiter un Autre Document',
    },
    pricing: {
      title: '100% Gratuit pour Toujours et Soutenu par la Communauté',
      subtitle: 'Aucun abonnement, aucun paiement caché, aucune inscription requise. Tous les outils PDF s’exécutent gratuitement.',
      freeCoreName: 'Outils PDF de Base ($0)',
      byokAiName: 'Intelligence IA (BYOK — Gratuit)',
      supporterName: 'Soutien Communautaire ($3+)',
      supportBtn: '☕ Soutenir / Pourboire',
      faqTitle: 'Foire Aux Questions',
    },
    tools: {
      'merge-pdf': {
        title: 'Fusionner PDF en Ligne',
        badge: 'Traitement Local 100% Privé',
        subtitle: 'Combinez plusieurs fichiers PDF en un seul document clair et haute résolution en quelques secondes.',
        actionName: 'Fusionner les Fichiers PDF',
      },
      'split-pdf': {
        title: 'Diviser PDF en Ligne',
        badge: 'Extraire et Séparer des Pages',
        subtitle: 'Séparez les pages d’un PDF en fichiers distincts ou extrayez des plages personnalisées.',
        actionName: 'Diviser le Document PDF',
      },
      'compress-pdf': {
        title: 'Compresser PDF en Ligne',
        badge: 'Réduire la Taille Sans Perte de Qualité',
        subtitle: 'Réduisez la taille de votre document tout en préservant la netteté des polices et images.',
        actionName: 'Compresser le PDF Maintenant',
      },
      'rotate-pdf': {
        title: 'Faire Pivoter PDF en Ligne',
        badge: 'Correction Définitive de l’Orientation',
        subtitle: 'Pivotez vos pages en mode portrait ou paysage à 90, 180 ou 270 degrés instantanément.',
        actionName: 'Faire Pivoter les Pages',
      },
      'delete-pdf-pages': {
        title: 'Supprimer des Pages PDF',
        badge: 'Retirer les Pages Inutiles',
        subtitle: 'Supprimez sélectivement les pages blanches, redondantes ou confidentielles de tout PDF.',
        actionName: 'Supprimer les Pages Sélectionnées',
      },
      'jpg-to-pdf': {
        title: 'Convertisseur Images vers PDF',
        badge: 'PNG, JPG et WEBP vers PDF',
        subtitle: 'Transformez vos images en un document PDF paginé, soigné et prêt à être partagé.',
        actionName: 'Convertir les Images en PDF',
      },
      'pdf-to-jpg': {
        title: 'Convertir PDF en Image',
        badge: 'Rendu Haute Résolution',
        subtitle: 'Convertissez chaque page de votre PDF en images PNG, JPG ou WEBP nettes.',
        actionName: 'Convertir PDF en Images',
      },
      'word-to-pdf': {
        title: 'Convertir Word en PDF',
        badge: 'Préservation DOCX et DOC',
        subtitle: 'Convertissez vos documents Microsoft Word en PDF avec une fidélité parfaite de mise en page.',
        actionName: 'Convertir Word en PDF',
      },
      'excel-to-pdf': {
        title: 'Convertir Excel en PDF',
        badge: 'Feuilles XLSX et XLS',
        subtitle: 'Convertissez vos tableaux financiers et feuilles de calcul en rapports PDF prêts à l’impression.',
        actionName: 'Convertir Excel en PDF',
      },
      'pdf-to-word': {
        title: 'Convertir PDF en Word',
        badge: 'Reconstruction DOCX Modifiable',
        subtitle: 'Transformez vos documents PDF statiques en fichiers Microsoft Word entièrement modifiables.',
        actionName: 'Convertir PDF en Word',
      },
      'pdf-to-excel': {
        title: 'Convertir PDF en Excel',
        badge: 'Extraction de Données Tabulaires',
        subtitle: 'Extrayez les tableaux de données de vos rapports PDF directement dans Microsoft Excel.',
        actionName: 'Convertir PDF en Excel',
      },
      'watermark-pdf': {
        title: 'Filigrane PDF en Ligne',
        badge: 'Texte et Tampons Personnalisés',
        subtitle: 'Appliquez un filigrane de confidentialité, un tampon de brouillon ou une mention de droits.',
        actionName: 'Appliquer le Filigrane',
      },
      'protect-pdf': {
        title: 'Protéger PDF en Ligne',
        badge: 'Chiffrement AES-256',
        subtitle: 'Verrouillez vos documents sensibles avec des mots de passe robustes et des permissions sur mesure.',
        actionName: 'Chiffrer et Protéger le PDF',
      },
      'unlock-pdf': {
        title: 'Déverrouiller PDF en Ligne',
        badge: 'Suppression du Mot de Passe',
        subtitle: 'Supprimez définitivement les restrictions de mot de passe sur vos documents autorisés.',
        actionName: 'Déverrouiller le Document PDF',
      },
      'redact-pdf': {
        title: 'Caviarder PDF en Ligne',
        badge: 'Masquage Définitif des Données',
        subtitle: 'Supprimez définitivement les numéros confidentiels, noms et coordonnées sans fuite de données.',
        actionName: 'Caviarder le PDF Définitivement',
      },
      'ocr-pdf': {
        title: 'OCR PDF en Ligne',
        badge: 'PDF Sandwich avec Recherche',
        subtitle: 'Reconnaissance Optique de Caractères : Rendez vos documents numérisés sélectionnables et interrogeables.',
        actionName: 'Lancer la Reconnaissance OCR',
      },
      'compare-pdf': {
        title: 'Comparer Documents PDF',
        badge: 'Différence Visuelle Précise',
        subtitle: 'Mettez en évidence les modifications de texte, graphiques et mise en page entre deux révisions.',
        actionName: 'Comparer les Révisions',
      },
      'ai-summarize': {
        title: 'Résumé de Documents par IA',
        badge: 'Synthèses Exécutives & Actions',
        subtitle: 'Générez des résumés exécutifs et extrayez les points essentiels grâce à une IA avancée.',
        actionName: 'Générer le Résumé IA',
      },
      'ai-ask': {
        title: 'Discuter avec un PDF (IA Documentaire)',
        badge: 'RAG avec Citations de Pages',
        subtitle: 'Posez des questions précises sur votre document et obtenez des réponses avec renvoi de page.',
        actionName: 'Interroger l’IA',
      },
    },
  },

  de: {
    nav: {
      tools: 'PDF-Werkzeuge',
      features: 'Funktionen',
      pricing: 'Preise',
      faq: 'FAQ',
      getStarted: 'Kostenlos Starten',
    },
    hero: {
      dropPrompt: 'PDF-Dateien hier ablegen',
      dropSubtext: 'oder klicken, um Dateien vom Gerät auszuwählen',
      selectFiles: 'PDF-Dateien Auswählen',
      addMore: '+ Weitere Dateien hinzufügen',
      processing: 'Ihr Dokument wird sicher verarbeitet...',
      successTitle: 'Ihr Dokument ist fertig!',
      downloadBtn: 'Verarbeitete Datei Herunterladen',
      restartBtn: 'Anderes Dokument Verarbeiten',
    },
    pricing: {
      title: '100% Dauerhaft Kostenlos & Community-Unterstützt',
      subtitle: 'Keine Abos, keine versteckten Kosten und kein Registrierungszwang. Alle PDF-Tools laufen kostenlos im Browser.',
      freeCoreName: 'Kostenlose PDF-Basiswerkzeuge ($0)',
      byokAiName: 'KI-Dokumentenintelligenz (BYOK — Gratis)',
      supporterName: 'Community-Unterstützer ($3+)',
      supportBtn: '☕ Unterstützen / Trinkgeld',
      faqTitle: 'Häufig Gestellte Fragen',
    },
    tools: {
      'merge-pdf': {
        title: 'PDF Zusammenfügen Online',
        badge: '100% Private Lokale Verarbeitung',
        subtitle: 'Kombinieren Sie mehrere PDF-Dateien in Sekundenschnelle zu einem sauberen Dokument.',
        actionName: 'PDF-Dateien Zusammenfügen',
      },
      'split-pdf': {
        title: 'PDF Teilen Online',
        badge: 'Seiten Extrahieren & Trennen',
        subtitle: 'Trennen Sie PDF-Seiten in einzelne Dokumente oder extrahieren Sie Seitenbereiche.',
        actionName: 'PDF-Dokument Teilen',
      },
      'compress-pdf': {
        title: 'PDF Komprimieren Online',
        badge: 'Dateigröße Reduzieren Ohne Qualitätsverlust',
        subtitle: 'Reduzieren Sie die Dateigröße bei gleichbleibend scharfen Vektorschriften und Bildern.',
        actionName: 'PDF Jetzt Komprimieren',
      },
      'rotate-pdf': {
        title: 'PDF Drehen Online',
        badge: 'Dauerhafte Ausrichtungskorrektur',
        subtitle: 'Drehen Sie Hoch- und Querformatseiten sofort um 90, 180 oder 270 Grad.',
        actionName: 'Seiten Jetzt Drehen',
      },
      'delete-pdf-pages': {
        title: 'PDF-Seiten Löschen',
        badge: 'Unerwünschte Seiten Entfernen',
        subtitle: 'Entfernen Sie gezielt leere, doppelte oder vertrauliche Seiten aus jedem PDF.',
        actionName: 'Ausgewählte Seiten Löschen',
      },
      'jpg-to-pdf': {
        title: 'Bilder zu PDF Konverter',
        badge: 'PNG, JPG & WEBP zu PDF',
        subtitle: 'Konvertieren Sie Bilddateien in ein sauberes, paginiertes PDF-Dokument.',
        actionName: 'Bilder in PDF Umwandeln',
      },
      'pdf-to-jpg': {
        title: 'PDF zu Bild Konverter',
        badge: 'Hochauflösendes Rendering',
        subtitle: 'Konvertieren Sie jede Seite Ihres PDFs in gestochen scharfe PNG-, JPG- oder WEBP-Bilder.',
        actionName: 'PDF in Bilder Umwandeln',
      },
      'word-to-pdf': {
        title: 'Word zu PDF Konverter',
        badge: 'DOCX & DOC Erhaltung',
        subtitle: 'Konvertieren Sie Microsoft Word-Dokumente mit perfektem Layout in PDF.',
        actionName: 'Word in PDF Umwandeln',
      },
      'excel-to-pdf': {
        title: 'Excel zu PDF Konverter',
        badge: 'XLSX & XLS Tabellenkalkulationen',
        subtitle: 'Konvertieren Sie Finanztabellen in druckfertige, paginierte PDF-Berichte.',
        actionName: 'Excel in PDF Umwandeln',
      },
      'pdf-to-word': {
        title: 'PDF zu Word Konverter',
        badge: 'Editierbare DOCX-Rekonstruktion',
        subtitle: 'Wandeln Sie statische PDF-Dateien in bearbeitbare Microsoft Word-Dateien um.',
        actionName: 'PDF in Word Umwandeln',
      },
      'pdf-to-excel': {
        title: 'PDF zu Excel Konverter',
        badge: 'Tabellendaten-Extraktion',
        subtitle: 'Extrahieren Sie Tabellen aus PDF-Berichten direkt in Microsoft Excel.',
        actionName: 'PDF in Excel Umwandeln',
      },
      'watermark-pdf': {
        title: 'PDF Wasserzeichen Online',
        badge: 'Benutzerdefinierter Text & Stempel',
        subtitle: 'Fügen Sie diagonale oder zentrierte Copyright-Vermerke und Vertraulichkeitsstempel hinzu.',
        actionName: 'Wasserzeichen Anwenden',
      },
      'protect-pdf': {
        title: 'PDF Schützen Online',
        badge: 'AES-256 Verschlüsselung',
        subtitle: 'Sperren Sie sensible Dokumente mit starken Passwörtern und Berechtigungen.',
        actionName: 'PDF Verschlüsseln & Schützen',
      },
      'unlock-pdf': {
        title: 'PDF Entsperren Online',
        badge: 'Passwort-Entfernung',
        subtitle: 'Entfernen Sie Passwortbeschränkungen dauerhaft von autorisierten Dokumenten.',
        actionName: 'PDF-Dokument Entsperren',
      },
      'redact-pdf': {
        title: 'PDF Schwärzen Online',
        badge: 'Dauerhafter Datenschutz',
        subtitle: 'Schwärzen Sie vertrauliche Nummern und Daten dauerhaft mit Null-Leck-Garantie.',
        actionName: 'PDF Dauerhaft Schwärzen',
      },
      'ocr-pdf': {
        title: 'OCR PDF Online',
        badge: 'Durchsuchbares Sandwich-PDF',
        subtitle: 'Optische Zeichenerkennung: Machen Sie gescannte Dokumente markier- und durchsuchbar.',
        actionName: 'OCR-Erkennung Starten',
      },
      'compare-pdf': {
        title: 'PDF-Dokumente Vergleichen',
        badge: 'Visueller Differenzabgleich',
        subtitle: 'Heben Sie Text- und Layoutänderungen zwischen zwei PDF-Revisionen nebeneinander hervor.',
        actionName: 'Revisionen Vergleichen',
      },
      'ai-summarize': {
        title: 'KI-Dokumentenzusammenfassung',
        badge: 'Executive Briefings & Handlungspunkte',
        subtitle: 'Erstellen Sie Management-Zusammenfassungen und Kennzahlen mit hochentwickelter KI.',
        actionName: 'KI-Zusammenfassung Erstellen',
      },
      'ai-ask': {
        title: 'Mit PDF Chatten (Dokumenten-KI)',
        badge: 'RAG mit Seitenzitaten',
        subtitle: 'Stellen Sie präzise Fragen zu Ihrem Dokument und erhalten Sie Antworten mit Seitennachweis.',
        actionName: 'KI Befragen',
      },
    },
  },

  hi: {
    nav: {
      tools: 'PDF टूल्स',
      features: 'विशेषताएं',
      pricing: 'मूल्य निर्धारण',
      faq: 'अक्सर पूछे जाने वाले प्रश्न',
      getStarted: 'मुफ्त में शुरू करें',
    },
    hero: {
      dropPrompt: 'अपनी PDF फाइलें यहाँ खींचें और छोड़ें',
      dropSubtext: 'या अपनी डिवाइस से फाइलें चुनने के लिए क्लिक करें',
      selectFiles: 'PDF फाइलें चुनें',
      addMore: '+ और फाइलें जोड़ें',
      processing: 'आपका दस्तावेज़ सुरक्षित रूप से संसाधित हो रहा है...',
      successTitle: 'आपका दस्तावेज़ तैयार है!',
      downloadBtn: 'संसाधित फाइल डाउनलोड करें',
      restartBtn: 'दूसरा दस्तावेज़ प्रोसेस करें',
    },
    pricing: {
      title: '100% हमेशा मुफ्त और समुदाय द्वारा समर्थित',
      subtitle: 'कोई सब्सक्रिप्शन नहीं, कोई छिपा हुआ शुल्क नहीं, कोई लॉगिन अनिवार्य नहीं। सभी टूल्स आपके ब्राउज़र में मुफ्त चलते हैं।',
      freeCoreName: 'मुफ्त कोर PDF टूल्स ($0)',
      byokAiName: 'AI इंटेलिजेंस (BYOK — मुफ्त)',
      supporterName: 'कम्युनिटी सपोर्टर ($3+ टिप)',
      supportBtn: '☕ सहयोग / टिप दें',
      faqTitle: 'अक्सर पूछे जाने वाले सवाल (FAQ)',
    },
    tools: {
      'merge-pdf': {
        title: 'PDF फाइलें ऑनलाइन जोड़ें (Merge)',
        badge: '100% निजी लोकल प्रोसेसिंग',
        subtitle: 'कुछ ही सेकंड में कई PDF फाइलों को एक साफ, उच्च-गुणवत्ता वाले दस्तावेज़ में जोड़ें।',
        actionName: 'PDF फाइलें जोड़ें',
      },
      'split-pdf': {
        title: 'PDF अलग करें (Split)',
        badge: 'पेज निकालें और अलग करें',
        subtitle: 'PDF पेजों को अलग-अलग फाइलों में बांटें या अपनी पसंद के पेज निकालें।',
        actionName: 'PDF दस्तावेज़ अलग करें',
      },
      'compress-pdf': {
        title: 'PDF कंप्रेस करें (Compress)',
        badge: 'गुणवत्ता खोए बिना साइज घटाएं',
        subtitle: 'साफ अक्षरों और छवियों को बनाए रखते हुए फाइल का साइज तुरंत कम करें।',
        actionName: 'PDF अभी कंप्रेस करें',
      },
      'rotate-pdf': {
        title: 'PDF घुमाएं (Rotate)',
        badge: 'पेज दिशा सुधारें',
        subtitle: 'पोर्ट्रेट और लैंडस्केप पेजों को तुरंत 90, 180 या 270 डिग्री घुमाएं।',
        actionName: 'पेज घुमाएं',
      },
      'delete-pdf-pages': {
        title: 'PDF पेज हटाएं (Delete)',
        badge: 'अनावश्यक पेज हटाएं',
        subtitle: 'किसी भी PDF से खाली, अनावश्यक या गोपनीय पेजों को आसानी से हटाएं।',
        actionName: 'चुने हुए पेज हटाएं',
      },
      'jpg-to-pdf': {
        title: 'फोटो से PDF कनवर्टर',
        badge: 'PNG, JPG और WEBP से PDF',
        subtitle: 'अपनी तस्वीरों को एक साफ, उच्च-गुणवत्ता वाली PDF फाइल में बदलें।',
        actionName: 'फोटो को PDF में बदलें',
      },
      'pdf-to-jpg': {
        title: 'PDF से फोटो कनवर्टर',
        badge: 'उच्च रेजोल्यूशन रेंडर',
        subtitle: 'अपने PDF के हर पेज को साफ PNG, JPG या WEBP फोटो में बदलें।',
        actionName: 'PDF को फोटो में बदलें',
      },
      'word-to-pdf': {
        title: 'Word से PDF कनवर्टर',
        badge: 'DOCX और DOC लेआउट सुरक्षा',
        subtitle: 'Microsoft Word फाइलों को बिना किसी लेआउट खराबी के PDF में बदलें।',
        actionName: 'Word को PDF में बदलें',
      },
      'excel-to-pdf': {
        title: 'Excel से PDF कनवर्टर',
        badge: 'XLSX और XLS स्प्रेडशीट',
        subtitle: 'वित्तीय स्प्रेडशीट और टेबल को प्रिंट-तैयार PDF रिपोर्ट में बदलें।',
        actionName: 'Excel को PDF में बदलें',
      },
      'pdf-to-word': {
        title: 'PDF से Word कनवर्टर',
        badge: 'एडिटेबल DOCX फाइल',
        subtitle: 'PDF फाइलों को पूरी तरह से संपादन योग्य Microsoft Word फाइलों में बदलें।',
        actionName: 'PDF को Word में बदलें',
      },
      'pdf-to-excel': {
        title: 'PDF से Excel कनवर्टर',
        badge: 'डेटा टेबल निष्कर्षण',
        subtitle: 'PDF रिपोर्ट से डेटा टेबल को सीधे Excel स्प्रेडशीट में निकालें।',
        actionName: 'PDF को Excel में बदलें',
      },
      'watermark-pdf': {
        title: 'PDF में वॉटरमार्क लगाएं',
        badge: 'कस्टम टेक्स्ट और मुहर',
        subtitle: 'कॉपीराइट स्टाम्प, ड्राफ्ट मार्क या गोपनीय सूचना का वॉटरमार्क जोड़ें।',
        actionName: 'वॉटरमार्क लगाएं',
      },
      'protect-pdf': {
        title: 'PDF पासवर्ड से सुरक्षित करें',
        badge: 'AES-256 एन्क्रिप्शन',
        subtitle: 'मजबूत पासवर्ड और सुरक्षा अनुमतियों के साथ अपने गोपनीय दस्तावेज़ को सुरक्षित करें।',
        actionName: 'PDF एन्क्रिप्ट करें',
      },
      'unlock-pdf': {
        title: 'PDF पासवर्ड हटाएं (Unlock)',
        badge: 'पासवर्ड हटाना',
        subtitle: 'अधिकृत दस्तावेज़ों से पासवर्ड प्रतिबंध हमेशा के लिए हटाएं।',
        actionName: 'PDF अनलॉक करें',
      },
      'redact-pdf': {
        title: 'PDF डेटा ब्लैकआउट (Redact)',
        badge: 'स्थायी गोपनीयता सुरक्षा',
        subtitle: 'गोपनीय नंबरों, नामों और पते को हमेशा के लिए सुरक्षित रूप से छुपाएं।',
        actionName: 'PDF डेटा स्थायी रूप से छुपाएं',
      },
      'ocr-pdf': {
        title: 'OCR PDF ऑनलाइन',
        badge: 'सर्च करने योग्य PDF',
        subtitle: 'ऑप्टिकल कैरेक्टर रिकग्निशन: स्कैन किए गए दस्तावेजों को टेक्स्ट में बदलें।',
        actionName: 'OCR प्रक्रिया शुरू करें',
      },
      'compare-pdf': {
        title: 'दो PDF दस्तावेजों की तुलना करें',
        badge: 'विजुअल अंतर पहचानें',
        subtitle: 'दो PDF फाइलों के बीच टेक्स्ट और लेआउट के अंतर को आसानी से देखें।',
        actionName: 'दस्तावेजों की तुलना करें',
      },
      'ai-summarize': {
        title: 'AI दस्तावेज़ सारांश (Summarizer)',
        badge: 'कार्यकारी सारांश और मुख्य बिंदु',
        subtitle: 'उन्नत AI तकनीक का उपयोग करके अपने दस्तावेज़ का सटीक सारांश प्राप्त करें।',
        actionName: 'AI सारांश बनाएं',
      },
      'ai-ask': {
        title: 'PDF से चैट करें (AI Intelligence)',
        badge: 'पेज संदर्भ के साथ RAG AI',
        subtitle: 'अपने दस्तावेज़ से जुड़े प्रश्न पूछें और सटीक पेज नंबर के साथ उत्तर पाएं।',
        actionName: 'AI से पूछें',
      },
    },
  },

  ja: {
    nav: {
      tools: 'PDFツール',
      features: '機能',
      pricing: '料金プラン',
      faq: 'よくある質問',
      getStarted: '無料で始める',
    },
    hero: {
      dropPrompt: 'ここにPDFファイルをドロップ',
      dropSubtext: 'またはクリックして端末からファイルを選択',
      selectFiles: 'PDFファイルを選択',
      addMore: '+ ファイルを追加',
      processing: 'ドキュメントを安全に処理中...',
      successTitle: 'ドキュメントの準備ができました！',
      downloadBtn: '処理済みファイルをダウンロード',
      restartBtn: '別のドキュメントを処理',
    },
    pricing: {
      title: '100% 永久無料 & コミュニティ支援型',
      subtitle: 'サブスクリプション不要、登録不要、隠し料金なし。すべてのコアPDFツールがブラウザ内で完全無料で動作します。',
      freeCoreName: '無料コアPDF機能（$0）',
      byokAiName: 'AIドキュメント機能（BYOK — 無料）',
      supporterName: 'コミュニティサポーター（$3+）',
      supportBtn: '☕ 開発を応援 / チップ',
      faqTitle: 'よくある質問（FAQ）',
    },
    tools: {
      'merge-pdf': {
        title: 'PDF 結合 オンライン',
        badge: '100% 安全なローカル処理',
        subtitle: '複数のPDFファイルを数秒で1つの高解像度ドキュメントに結合します。',
        actionName: 'PDFファイルを結合',
      },
      'split-pdf': {
        title: 'PDF 分割 オンライン',
        badge: 'ページ抽出・分離',
        subtitle: 'PDFページを個別のファイルに分割、または指定したページ範囲を抽出します。',
        actionName: 'PDFドキュメントを分割',
      },
      'compress-pdf': {
        title: 'PDF 圧縮 オンライン',
        badge: '画質を落とさずファイル容量削減',
        subtitle: '鮮明な文字と画像を保ちながら、ドキュメントの容量を効率的に削減します。',
        actionName: 'PDFを今すぐ圧縮',
      },
      'rotate-pdf': {
        title: 'PDF 回転 オンライン',
        badge: 'ページの向きを恒久修正',
        subtitle: '縦向き・横向きのPDFページを90度、180度、270度瞬時に回転します。',
        actionName: 'ページを回転する',
      },
      'delete-pdf-pages': {
        title: 'PDF ページ削除',
        badge: '不要なページを取り除く',
        subtitle: '白紙や重複ページ、不要なページを選択してPDFから安全に削除します。',
        actionName: '選択したページを削除',
      },
      'jpg-to-pdf': {
        title: '画像 PDF 変換',
        badge: 'PNG・JPG・WEBP を PDF に',
        subtitle: '複数の画像ファイルを美しくページ分割されたPDFドキュメントに変換します。',
        actionName: '画像をPDFに変換',
      },
      'pdf-to-jpg': {
        title: 'PDF 画像 変換',
        badge: '高解像度レンダリング',
        subtitle: 'PDFの各ページを鮮明なPNG、JPG、WEBP画像ファイルに変換します。',
        actionName: 'PDFを画像に変換',
      },
      'word-to-pdf': {
        title: 'Word PDF 変換',
        badge: 'DOCX・DOC 完全レイアウト保持',
        subtitle: 'Microsoft Word文書を崩れのない完璧なレイアウトでPDFに変換します。',
        actionName: 'WordをPDFに変換',
      },
      'excel-to-pdf': {
        title: 'Excel PDF 変換',
        badge: 'XLSX・XLS スプレッドシート',
        subtitle: '財務表やデータシートを印刷に最適なPDFレポートに変換します。',
        actionName: 'ExcelをPDFに変換',
      },
      'pdf-to-word': {
        title: 'PDF Word 変換',
        badge: '編集可能なDOCX再構成',
        subtitle: '固定されたPDF文書を完全に編集可能なMicrosoft Wordファイルに変換します。',
        actionName: 'PDFをWordに変換',
      },
      'pdf-to-excel': {
        title: 'PDF Excel 変換',
        badge: '表データ抽出',
        subtitle: 'PDFレポート内の表データを直接Microsoft Excelスプレッドシートに抽出します。',
        actionName: 'PDFをExcelに変換',
      },
      'watermark-pdf': {
        title: 'PDF 透かし追加 オンライン',
        badge: 'カスタム文字＆スタンプ重ね合わせ',
        subtitle: '著作権表示、社外秘スタンプ、ドラフトマークを文書に適用します。',
        actionName: '透かしを適用する',
      },
      'protect-pdf': {
        title: 'PDF 暗号化・パスワード保護',
        badge: 'AES-256 暗号化',
        subtitle: '強力なパスワードと権限設定で重要書類を強固に保護します。',
        actionName: 'PDFを暗号化して保護',
      },
      'unlock-pdf': {
        title: 'PDF パスワード解除 オンライン',
        badge: 'パスワード制限の解除',
        subtitle: '許可されたPDF文書からパスワード制限を恒久的に解除します。',
        actionName: 'PDFのロックを解除',
      },
      'redact-pdf': {
        title: 'PDF 黒塗り・個人情報保護',
        badge: '恒久的な完全マスキング',
        subtitle: '機密番号や氏名を復元不可能な状態で確実に黒塗り処理します。',
        actionName: 'PDFを恒久的に黒塗り',
      },
      'ocr-pdf': {
        title: 'PDF OCR 文字認識 オンライン',
        badge: '検索可能なサンドイッチPDF',
        subtitle: '光学文字認識：スキャンされた文書を選択・検索可能なテキストに変換します。',
        actionName: 'OCR文字認識を実行',
      },
      'compare-pdf': {
        title: 'PDF ドキュメント比較',
        badge: '視覚的差分チェック',
        subtitle: '2つのPDF文書のテキストやレイアウトの違いを並べて視覚的にハイライトします。',
        actionName: 'リビジョンを比較する',
      },
      'ai-summarize': {
        title: 'AI ドキュメント要約',
        badge: 'エグゼクティブサマリー＆アクション',
        subtitle: '高度なAIを使用して、重要指標や要点をまとめた要約を自動生成します。',
        actionName: 'AI要約を生成する',
      },
      'ai-ask': {
        title: 'PDFとチャット（AIインテリジェンス）',
        badge: 'ページ引用付きRAG AI',
        subtitle: 'ドキュメントに関する質問に、該当ページ番号の引用付きで正確に回答します。',
        actionName: 'AIに質問する',
      },
    },
  },
};

/**
 * Resolves a translated string with fallback to English.
 */
export function getTranslation(locale: string, keyPath: string, fallback?: string): string {
  const loc = (SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'en') as SupportedLocale;
  const parts = keyPath.split('.');
  let current: any = TRANSLATIONS[loc];

  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p];
    } else {
      // Fallback to English
      let enCurrent: any = TRANSLATIONS.en;
      for (const ep of parts) {
        if (enCurrent && typeof enCurrent === 'object' && ep in enCurrent) {
          enCurrent = enCurrent[ep];
        } else {
          return fallback || keyPath;
        }
      }
      return typeof enCurrent === 'string' ? enCurrent : (fallback || keyPath);
    }
  }

  return typeof current === 'string' ? current : (fallback || keyPath);
}

/**
 * Resolves localized tool metadata.
 */
export function getToolI18n(locale: string, toolKey: string): ToolI18nEntry {
  const loc = (SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'en') as SupportedLocale;
  const tool = TRANSLATIONS[loc]?.tools[toolKey] || TRANSLATIONS.en.tools[toolKey];

  if (!tool) {
    return {
      title: `${toolKey.replace(/-/g, ' ')}`,
      badge: 'Document Utility',
      subtitle: 'Process document securely in the cloud or locally.',
      actionName: 'Process Document',
    };
  }

  return tool;
}
