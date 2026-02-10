/**
 * French translations for exercise descriptions and instructions.
 * Used by lib/exerciseLocale.ts to provide locale-aware content.
 * Separated from exercises.ts to keep the data file clean and
 * make it easy to add more languages later.
 */

interface ExerciseFrTranslation {
  descriptionFr: string;
  instructionsFr?: string[];
}

export const exerciseTranslationsFr: Record<string, ExerciseFrTranslation> = {
  // ═══════════════════════════════════════
  // BACK
  // ═══════════════════════════════════════
  'ex_001': {
    descriptionFr: 'Rowing unilatéral pour le développement des dorsaux. Gardez le dos plat et tirez le coude bien haut.',
  },
  'ex_002': {
    descriptionFr: 'Cible les dorsaux et les pectoraux avec un mouvement en arc au-dessus de la tête. Gardez une légère flexion des coudes.',
    instructionsFr: [
      'Allongez-vous sur un banc plat, tête à une extrémité, pieds au sol.',
      'Tenez un haltère à deux mains et tendez les bras au-dessus de la poitrine.',
      'En gardant une légère flexion des coudes, descendez lentement l\'haltère derrière la tête jusqu\'à sentir un étirement au niveau des pectoraux et des épaules.',
      'Marquez une pause, puis ramenez l\'haltère à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_003': {
    descriptionFr: 'Rowing buste contre banc incliné. Excellent pour isoler le haut du dos sans solliciter les lombaires.',
    instructionsFr: [
      'Réglez un banc incliné à 45 degrés.',
      'Prenez un haltère dans chaque main et installez-vous poitrine contre le banc.',
      'Laissez les bras pendre, haltères sous les épaules, bras tendus.',
      'Tirez les haltères vers la poitrine en serrant les omoplates.',
      'Marquez une pause en haut, puis redescendez lentement les haltères à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_004': {
    descriptionFr: 'Isolation du deltoïde postérieur et du haut du dos. Allongez-vous face contre banc incliné.',
  },
  'ex_005': {
    descriptionFr: 'Grand classique pour les dorsaux. Tirez la barre vers le haut de la poitrine en serrant les omoplates.',
    instructionsFr: [
      'Réglez la hauteur du siège et installez-vous avec les genoux sous les coussins, pieds à plat au sol.',
      'Saisissez les poignées en prise supination, légèrement plus large que les épaules.',
      'Asseyez-vous bien droit, poitrine ouverte et épaules en arrière, avec une légère cambrure lombaire.',
      'Tirez les poignées vers la poitrine en serrant les omoplates.',
      'Marquez une pause en bas du mouvement, puis relâchez lentement vers la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_006': {
    descriptionFr: 'Épaisseur du milieu du dos. Tirez vers le bas de la poitrine, buste droit.',
    instructionsFr: [
      'Asseyez-vous sur la machine de rowing, pieds à plat sur les repose-pieds, genoux légèrement fléchis.',
      'Saisissez les poignées en pronation, dos droit et épaules relâchées.',
      'Tirez les poignées vers le corps en serrant les omoplates.',
      'Marquez une pause au point de contraction maximale, puis relâchez lentement vers la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_007': {
    descriptionFr: 'Mouvement composé pour le dos. Penchez le buste en avant, tirez la barre vers le bas de la poitrine.',
    instructionsFr: [
      'Réglez un banc incliné à 45 degrés.',
      'Allongez-vous face contre le banc, poitrine contre le coussin, pieds au sol.',
      'Saisissez la barre en pronation, légèrement plus large que les épaules.',
      'Gardez le dos droit et les abdominaux engagés.',
      'Tirez la barre vers la poitrine en serrant les omoplates.',
      'Marquez une pause en haut, puis redescendez lentement la barre à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_008': {
    descriptionFr: 'Excellent pour l\'épaisseur du dos. Utilisez une poignée en V pour une prise neutre.',
  },
  'ex_009': {
    descriptionFr: 'Le roi des exercices composés. Gardez le dos plat et poussez à travers les talons.',
  },
  'ex_010': {
    descriptionFr: 'Exercice au poids de corps pour les dorsaux. Prise large pour la largeur, serrée pour l\'épaisseur.',
    instructionsFr: [
      'Suspendez-vous à une barre de traction, paumes vers l\'avant, bras tendus.',
      'Engagez les abdominaux et serrez les omoplates.',
      'Tirez le corps vers la barre en pliant les coudes et en amenant la poitrine vers la barre.',
      'Marquez une pause en haut du mouvement, puis redescendez lentement à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_011': {
    descriptionFr: 'Traction en supination. Sollicite davantage les biceps que les tractions classiques.',
    instructionsFr: [
      'Suspendez-vous à une barre de traction, paumes vers vous, mains écartées à largeur d\'épaules.',
      'Engagez les abdominaux et tirez le corps vers la barre en guidant avec la poitrine.',
      'Continuez jusqu\'à ce que le menton dépasse la barre.',
      'Marquez une pause en haut, puis redescendez lentement à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_012': {
    descriptionFr: 'Isolation des dorsaux. Gardez les bras tendus et concentrez-vous sur la contraction des grands dorsaux.',
    instructionsFr: [
      'Fixez une barre droite sur la poulie haute d\'une machine à câble.',
      'Placez-vous face à la machine, pieds à largeur d\'épaules.',
      'Saisissez la barre en pronation, bras tendus, paumes vers le bas.',
      'Engagez les dorsaux et tirez la barre vers les cuisses en gardant les bras tendus tout au long du mouvement.',
      'Marquez une pause en bas, puis remontez lentement la barre à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_085': {
    descriptionFr: 'Rowing au poids de corps sur barre basse ou TRX. Excellent exercice dos pour le home gym.',
  },
  'ex_086': {
    descriptionFr: 'Activation du deltoïde postérieur et du haut du dos. Écartez l\'élastique à hauteur de poitrine.',
  },
  'ex_087': {
    descriptionFr: 'Rowing unilatéral à la poulie pour un développement équilibré des dorsaux. Légère rotation en fin de mouvement.',
  },
  'ex_088': {
    descriptionFr: 'Rowing strict à la barre, reposée au sol à chaque rep. Tirage explosif, descente contrôlée.',
  },

  // ═══════════════════════════════════════
  // SHOULDERS
  // ═══════════════════════════════════════
  'ex_013': {
    descriptionFr: 'Isolation du deltoïde latéral. Montez jusqu\'à hauteur d\'épaules, contrôlez la descente.',
    instructionsFr: [
      'Debout, pieds à largeur d\'épaules, un haltère dans chaque main, paumes vers le corps.',
      'Gardez le dos droit et engagez les abdominaux.',
      'Levez les bras sur les côtés, coudes légèrement fléchis, jusqu\'à ce qu\'ils soient parallèles au sol.',
      'Marquez une pause en haut, puis redescendez lentement les bras à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_014': {
    descriptionFr: 'Isolation du deltoïde antérieur. En alternance ou les deux bras simultanément.',
  },
  'ex_015': {
    descriptionFr: 'Développé avec rotation sollicitant les trois faisceaux du deltoïde. Départ paumes vers soi, rotation en montant.',
    instructionsFr: [
      'Assis sur un banc avec dossier, tenez un haltère dans chaque main à hauteur d\'épaules, paumes vers vous, coudes fléchis.',
      'Poussez les haltères vers le haut jusqu\'à extension complète des bras, paumes vers l\'avant en haut.',
      'Effectuez une rotation des poignets pendant la montée pour que les paumes soient orientées vers l\'avant en position haute.',
      'Marquez une pause en haut, puis redescendez lentement les haltères à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_016': {
    descriptionFr: 'Développé composé pour les épaules. Poussez au-dessus de la tête, verrouillez en haut.',
    instructionsFr: [
      'Debout, pieds à largeur d\'épaules, un haltère dans chaque main à hauteur d\'épaules, paumes vers l\'avant.',
      'Poussez un haltère au-dessus de la tête en tendant complètement le bras.',
      'Redescendez l\'haltère à hauteur d\'épaules.',
      'Répétez avec l\'autre bras.',
      'Continuez en alternant les bras pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_017': {
    descriptionFr: 'Assis ou debout. Plus grande amplitude de mouvement qu\'à la barre.',
    instructionsFr: [
      'Assis sur un banc, un haltère dans chaque main posé sur les cuisses.',
      'Montez les haltères à hauteur d\'épaules, paumes vers l\'avant.',
      'Poussez les haltères vers le haut jusqu\'à extension complète des bras au-dessus de la tête.',
      'Marquez une pause en haut, puis redescendez lentement les haltères à hauteur d\'épaules.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_018': {
    descriptionFr: 'Santé du deltoïde postérieur et de la coiffe des rotateurs. Tirez la corde vers le visage avec rotation externe en fin de mouvement.',
  },
  'ex_019': {
    descriptionFr: 'Trapèzes et deltoïdes latéraux. Utilisez une prise large pour réduire le risque d\'impingement.',
    instructionsFr: [
      'Debout, pieds à largeur d\'épaules, genoux légèrement fléchis, saisissez l\'accessoire de câble en pronation.',
      'Gardez le dos droit et les abdominaux engagés tout au long de l\'exercice.',
      'Tirez l\'accessoire vers le menton en guidant avec les coudes.',
      'Marquez une pause en haut en serrant les omoplates.',
      'Redescendez lentement l\'accessoire à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_020': {
    descriptionFr: 'Isolation des trapèzes aux haltères. Haussez les épaules bien haut, maintenez en haut.',
    instructionsFr: [
      'Debout, pieds à largeur d\'épaules, un haltère dans chaque main, paumes vers le corps.',
      'Gardez les bras tendus, haltères le long du corps.',
      'Montez les épaules le plus haut possible, comme pour toucher les oreilles.',
      'Maintenez la contraction une seconde, puis redescendez lentement les épaules à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_021': {
    descriptionFr: 'Gros constructeur de trapèzes. Permet de charger plus lourd qu\'aux haltères.',
    instructionsFr: [
      'Debout, pieds à largeur d\'épaules, tenez une barre devant vous en pronation.',
      'Gardez les bras et le dos droits tout au long de l\'exercice.',
      'Montez les épaules vers les oreilles le plus haut possible en contractant les trapèzes en haut.',
      'Maintenez un instant, puis redescendez lentement les épaules à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_022': {
    descriptionFr: 'Isolation du deltoïde postérieur à la machine. Excellent pour la connexion muscle-cerveau.',
  },
  'ex_089': {
    descriptionFr: 'Élévation latérale à tension constante. Câble derrière ou devant le corps.',
  },
  'ex_090': {
    descriptionFr: 'Alternative au développé épaules au poids de corps. Hanches hautes, tête vers le sol.',
  },
  'ex_091': {
    descriptionFr: 'Développé épaules guidé. Sûr pour les charges lourdes, idéal pour les débutants.',
  },
  'ex_092': {
    descriptionFr: 'Écartement d\'élastique bras au-dessus de la tête. Excellent pour la santé des épaules et la posture.',
  },

  // ═══════════════════════════════════════
  // CHEST
  // ═══════════════════════════════════════
  'ex_023': {
    descriptionFr: 'Le grand classique pour les pectoraux. Barre au milieu de la poitrine, poussez vers le haut et légèrement en arrière.',
    instructionsFr: [
      'Allongez-vous sur un banc plat, pieds au sol, dos plaqué contre le banc.',
      'Saisissez la barre en pronation, légèrement plus large que les épaules.',
      'Décrochez la barre et maintenez-la au-dessus de la poitrine, bras tendus.',
      'Descendez lentement la barre vers la poitrine en gardant les coudes rentrés.',
      'Marquez une pause lorsque la barre touche la poitrine.',
      'Repoussez la barre vers la position de départ en tendant les bras.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_024': {
    descriptionFr: 'Accent sur le haut des pectoraux. Angle de 30 à 45 degrés optimal.',
    instructionsFr: [
      'Réglez un banc incliné à 45 degrés.',
      'Asseyez-vous, dos contre le dossier, pieds à plat au sol.',
      'Tenez un haltère dans chaque main en pronation, paumes vers l\'intérieur.',
      'Tendez les bras au-dessus de la poitrine avec une légère flexion des coudes.',
      'Descendez lentement les haltères vers les épaules, coudes près du corps.',
      'Marquez une pause en bas, puis repoussez les haltères à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_025': {
    descriptionFr: 'Accent sur le bas des pectoraux. Souvent l\'angle le plus fort pour le développé.',
    instructionsFr: [
      'Allongez-vous sur un banc décliné, pieds fixés, tête plus basse que les hanches.',
      'Saisissez la barre en prise inversée, légèrement plus large que les épaules.',
      'Décrochez la barre et descendez-la lentement vers la poitrine, coudes rentrés.',
      'Marquez une pause en bas, puis repoussez la barre à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_026': {
    descriptionFr: 'Plus grande amplitude qu\'à la barre. Chaque bras travaille indépendamment.',
    instructionsFr: [
      'Allongez-vous sur un banc plat, pieds au sol, dos plaqué contre le banc.',
      'Tenez un haltère dans chaque main, paumes vers l\'avant, bras tendus au-dessus de la poitrine.',
      'Descendez lentement les haltères sur les côtés de la poitrine, coudes à 90 degrés.',
      'Marquez une pause, puis repoussez les haltères à la position de départ en tendant complètement les bras.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_027': {
    descriptionFr: 'Haut des pectoraux avec amplitude complète. Possibilité de rapprocher les haltères en haut.',
    instructionsFr: [
      'Assis sur un banc incliné, un haltère dans chaque main posé sur les cuisses.',
      'Adossez-vous et aidez-vous des cuisses pour monter les haltères à hauteur d\'épaules, paumes vers l\'avant.',
      'Une fois à hauteur d\'épaules, tournez les poignets pour que les paumes soient orientées vers l\'avant.',
      'Poussez les haltères vers le haut avec les pectoraux et les épaules, bras en extension complète.',
      'Redescendez les haltères à la position de départ en gardant les coudes légèrement fléchis.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_028': {
    descriptionFr: 'Isolation des pectoraux. Légère flexion des coudes, étirement en bas du mouvement.',
    instructionsFr: [
      'Allongez-vous sur un banc plat, un haltère dans chaque main, paumes face à face.',
      'Tendez les bras au-dessus de la poitrine avec une légère flexion des coudes.',
      'En gardant les coudes légèrement fléchis, ouvrez les bras sur les côtés en arc de cercle jusqu\'à sentir un étirement dans les pectoraux.',
      'Marquez une pause, puis inversez le mouvement pour ramener les haltères à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_029': {
    descriptionFr: 'Tension constante sur toute l\'amplitude. Croisez les mains en bas pour une contraction maximale.',
  },
  'ex_030': {
    descriptionFr: 'Exercice fondamental au poids de corps pour les pectoraux. De nombreuses variantes possibles.',
    instructionsFr: [
      'Placez-vous en position de planche haute, mains légèrement plus larges que les épaules, pieds joints.',
      'Engagez les abdominaux et descendez le corps vers le sol en pliant les coudes, en gardant le corps aligné.',
      'Marquez une pause lorsque la poitrine est juste au-dessus du sol, puis repoussez-vous à la position de départ en tendant les bras.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_031': {
    descriptionFr: 'Penchez le buste en avant pour cibler les pectoraux. Excellent exercice de finition.',
    instructionsFr: [
      'Asseyez-vous sur le bord d\'un banc, mains agrippées de chaque côté des hanches.',
      'Glissez les hanches en avant du banc, jambes tendues, talons au sol.',
      'Fléchissez les coudes et descendez le corps vers le sol en gardant le dos proche du banc.',
      'Marquez une pause en bas, puis poussez sur les mains pour tendre les bras et remonter à la position de départ.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_032': {
    descriptionFr: 'Sûr pour les charges lourdes. Idéal pour les débutants ou les séries de finition.',
    instructionsFr: [
      'Réglez la hauteur du siège et installez-vous, dos plaqué contre le dossier.',
      'Saisissez les poignées en pronation, coudes à 90 degrés.',
      'Poussez les poignées vers l\'avant jusqu\'à extension complète des bras en expirant.',
      'Marquez une pause en fin de mouvement, puis revenez lentement à la position de départ en inspirant.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_093': {
    descriptionFr: 'Écarté pectoraux à la machine pour une tension constante. Excellente connexion muscle-cerveau.',
  },
  'ex_094': {
    descriptionFr: 'Isolation du haut des pectoraux. Banc incliné, mouvement en arc avec légère flexion des coudes.',
  },
  'ex_095': {
    descriptionFr: 'Développé pectoraux au home gym avec élastique ancré dans le dos. Courbe de tension croissante.',
  },

  // ═══════════════════════════════════════
  // UPPER ARMS (Biceps & Triceps)
  // ═══════════════════════════════════════
  'ex_033': {
    descriptionFr: 'Exercice de base pour les biceps. Gardez les coudes fixes, sans balancement.',
    instructionsFr: [
      'Tenez-vous debout, pieds écartés à la largeur des épaules, et saisissez une barre avec une prise en supination, paumes vers l\'avant.',
      'Gardez les coudes près du torse et expirez en montant la barre tout en contractant les biceps.',
      'Continuez à monter la barre jusqu\'à contraction complète des biceps, barre au niveau des épaules.',
      'Maintenez la position contractée un bref instant en serrant les biceps.',
      'Inspirez en redescendant lentement la barre à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_034': {
    descriptionFr: 'Alterné ou simultané. Supinez au sommet pour une contraction maximale.',
  },
  'ex_035': {
    descriptionFr: 'Prise neutre ciblant le brachial et les avant-bras. Ajoute de l\'épaisseur aux bras.',
    instructionsFr: [
      'Tenez-vous debout avec un haltère dans chaque main, paumes face au torse.',
      'Gardez les coudes près du torse et tournez les paumes vers l\'avant.',
      'Ce sera votre position de départ.',
      'En gardant le haut des bras immobile, expirez et montez les haltères en contractant les biceps.',
      'Continuez à monter jusqu\'à contraction complète des biceps, haltères au niveau des épaules.',
      'Maintenez la position contractée un bref instant en serrant les biceps.',
      'Puis inspirez et redescendez lentement les haltères à la position de départ.',
      'Répétez pour le nombre de répétitions recommandé.',
    ],
  },
  'ex_036': {
    descriptionFr: 'Isolation stricte des biceps. Aucun élan possible.',
    instructionsFr: [
      'Réglez la hauteur du siège et installez-vous avec les bras posés sur le pupitre et la poitrine contre le support.',
      'Saisissez les poignées en supination, légèrement plus large que la largeur des épaules.',
      'Gardez le haut des bras immobile et expirez en montant les poignées vers les épaules, en contractant les biceps.',
      'Marquez une pause au sommet du mouvement en serrant les biceps.',
      'Inspirez en redescendant lentement les poignées à la position de départ, bras complètement tendus.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_037': {
    descriptionFr: 'Isolation maximale du biceps. Coude calé contre l\'intérieur de la cuisse.',
    instructionsFr: [
      'Asseyez-vous sur un banc, pieds à plat au sol, et tenez un haltère dans une main, paume vers le haut.',
      'Posez le coude contre l\'intérieur de la cuisse, juste au-dessus du genou.',
      'En gardant le haut du bras immobile, expirez et montez l\'haltère vers l\'épaule.',
      'Marquez une pause au sommet en serrant le biceps.',
      'Inspirez et redescendez lentement l\'haltère à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité, puis changez de bras.',
    ],
  },
  'ex_038': {
    descriptionFr: 'Curl en position étirée. Excellent pour la longue portion du biceps.',
  },
  'ex_039': {
    descriptionFr: 'Isolation des triceps. Barre droite, corde ou barre en V.',
    instructionsFr: [
      'Placez-vous face à une poulie haute avec une barre droite à hauteur de poitrine.',
      'Saisissez la barre en pronation et reculez pour créer une tension dans le câble.',
      'Pieds écartés à la largeur des épaules, genoux légèrement fléchis.',
      'Gardez le dos droit et les abdos engagés tout au long de l\'exercice.',
      'Commencez bras tendu, perpendiculaire au sol.',
      'En gardant le haut du bras immobile, expirez et poussez la barre vers le bas jusqu\'à extension complète.',
      'Marquez une pause, puis inspirez et remontez lentement à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_040': {
    descriptionFr: 'Exercice de masse pour les triceps. Descendez la barre vers le front, puis tendez.',
    instructionsFr: [
      'Allongez-vous sur un banc plat, pieds à plat au sol, tête au bout du banc.',
      'Tenez la barre en pronation, mains écartées à la largeur des épaules, bras tendus au-dessus de la poitrine.',
      'En gardant le haut des bras immobile, descendez lentement la barre vers le front en fléchissant les coudes.',
      'Marquez une pause juste au-dessus du front, puis tendez les bras pour revenir à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_041': {
    descriptionFr: 'Accent sur la longue portion. Un ou deux bras, assis ou debout.',
    instructionsFr: [
      'Fixez une corde à une poulie haute et réglez la charge.',
      'Placez-vous dos à la poulie, pieds écartés à la largeur des épaules.',
      'Saisissez la corde à deux mains, paumes vers le bas, et amenez les mains au-dessus de la tête.',
      'Gardez le haut des bras près de la tête et perpendiculaires au sol.',
      'Descendez lentement la corde derrière la tête en fléchissant les coudes.',
      'Marquez une pause, puis tendez les bras pour revenir à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_042': {
    descriptionFr: 'Mouvement composé pour les triceps. Mains écartées à la largeur des épaules.',
    instructionsFr: [
      'Réglez la hauteur du siège et installez-vous sur le banc, pieds à plat au sol.',
      'Saisissez la barre en prise serrée, légèrement plus étroite que la largeur des épaules.',
      'Descendez la barre vers la poitrine en gardant les coudes près du corps.',
      'Marquez une pause en bas, puis poussez la barre vers le haut jusqu\'à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_043': {
    descriptionFr: 'Exercice au poids du corps pour les triceps. Mains en forme de losange.',
    instructionsFr: [
      'Placez-vous en position de planche haute, mains rapprochées formant un losange avec les pouces et les index.',
      'Gardez le corps aligné de la tête aux pieds, abdos et fessiers engagés.',
      'Descendez la poitrine vers le losange formé par les mains, coudes près du corps.',
      'Marquez une pause en bas, puis poussez pour revenir à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_044': {
    descriptionFr: 'Buste droit pour cibler les triceps. Sur banc ou barres parallèles.',
    instructionsFr: [
      'Asseyez-vous au bord d\'un banc, mains agrippant le rebord, doigts vers l\'avant.',
      'Glissez les fesses hors du banc en supportant votre poids avec les mains.',
      'Fléchissez les coudes et descendez le corps vers le sol, dos près du banc.',
      'Marquez une pause en bas, puis poussez pour revenir à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_045': {
    descriptionFr: 'Exercice d\'isolation pour les triceps. Penché en avant, tendez le bras en arrière et serrez au sommet.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules, un haltère dans la main droite.',
      'Fléchissez légèrement les genoux et penchez-vous en avant au niveau des hanches, dos droit.',
      'Montez le coude droit le long du corps, plié à 90 degrés.',
      'Tendez le bras droit vers l\'arrière en contractant le triceps.',
      'Marquez une pause, puis redescendez lentement l\'haltère à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité, puis changez de côté.',
    ],
  },
  'ex_046': {
    descriptionFr: 'Curl avec rotation. Montée en supination, pronation au sommet, descente en pronation. Travaille biceps et avant-bras.',
    instructionsFr: [
      'Debout, un haltère dans chaque main, paumes face au corps.',
      'Gardez les coudes près du torse et tournez les paumes vers l\'avant.',
      'Montez les haltères vers les épaules en gardant le haut des bras immobile.',
      'Au sommet du mouvement, tournez les poignets pour que les paumes soient vers l\'extérieur.',
      'Redescendez lentement les haltères à la position de départ en tournant les paumes face au corps.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_096': {
    descriptionFr: 'La prise coudée réduit la tension sur les poignets. Excellent pour la masse des biceps.',
  },
  'ex_097': {
    descriptionFr: 'Curl à la poulie pour une tension constante. Barre droite ou corde.',
  },
  'ex_098': {
    descriptionFr: 'Poitrine sur banc incliné, bras pendants. Isolation avec contraction maximale.',
  },
  'ex_099': {
    descriptionFr: 'Accent sur la longue portion du triceps à la poulie. Dos à la machine, extension au-dessus de la tête.',
  },
  'ex_100': {
    descriptionFr: 'Curl biceps avec élastique. Pieds sur la bande, montez en curl.',
  },
  'ex_101': {
    descriptionFr: 'Skull crusher avec barre EZ. Plus confortable pour les poignets que la barre droite.',
  },

  // ═══════════════════════════════════════
  // LOWER ARMS (Forearms)
  // ═══════════════════════════════════════
  'ex_047': {
    descriptionFr: 'Isolation des fléchisseurs de l\'avant-bras. Avant-bras posés sur un banc, flexion des poignets.',
    instructionsFr: [
      'Assis sur un banc, pieds à plat au sol, avant-bras posés sur les cuisses, saisissez une barre en supination.',
      'Laissez la barre rouler jusqu\'au bout des doigts, poignets droits.',
      'Montez lentement la barre en fléchissant les poignets.',
      'Marquez une pause au sommet, puis redescendez lentement à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_048': {
    descriptionFr: 'Travail des extenseurs de l\'avant-bras. Paumes vers le bas.',
    instructionsFr: [
      'Assis sur un banc, pieds à plat au sol.',
      'Tenez la bande en pronation, paumes vers le bas, enroulée autour des doigts.',
      'Posez les avant-bras sur les cuisses, poignets dépassant du bord.',
      'Montez lentement les poignets en contractant les avant-bras.',
      'Marquez une pause au sommet, puis redescendez lentement à la position de départ.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_049': {
    descriptionFr: 'Curl en pronation. Cible les avant-bras et le brachial.',
    instructionsFr: [
      'Fixez une barre droite sur une poulie basse.',
      'Placez-vous face à la machine, pieds écartés à la largeur des épaules, genoux légèrement fléchis.',
      'Saisissez la barre en supination, mains écartées à la largeur des épaules.',
      'Gardez les coudes près du corps et le haut des bras immobile tout au long de l\'exercice.',
      'Expirez et montez la barre vers les épaules en contractant les biceps.',
      'Marquez une pause au sommet en serrant les biceps.',
      'Inspirez et redescendez lentement la barre à la position de départ, bras complètement tendus.',
      'Répétez pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_050': {
    descriptionFr: 'Travail de la poigne et conditionnement général. Haltères lourds, marchez avec contrôle.',
    instructionsFr: [
      'Debout, un haltère lourd dans chaque main, paumes face au corps.',
      'Gardez le dos droit et les épaules en arrière.',
      'Avancez à petits pas contrôlés en maintenant une posture droite.',
      'Continuez à marcher sur la distance ou la durée souhaitée.',
      'Pour terminer, arrêtez-vous et posez les haltères avec précaution.',
    ],
  },

  // ═══════════════════════════════════════
  // UPPER LEGS
  // ═══════════════════════════════════════
  'ex_051': {
    descriptionFr: 'Roi des exercices pour les jambes. Descendre au parallèle ou plus bas.',
  },
  'ex_052': {
    descriptionFr: 'Squat à dominante quadriceps. Barre en position front rack.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules, barre posée sur le haut de la poitrine, juste sous les clavicules.',
      'Tenez la barre en prise pronation, coudes hauts et bras parallèles au sol.',
      'Descendez en squat en fléchissant genoux et hanches, dos droit et poitrine ouverte.',
      'Marquez une pause en bas du mouvement, puis poussez dans les talons pour remonter.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_053': {
    descriptionFr: 'Constructeur de quadriceps sans charge vertébrale. La position des pieds modifie l\'emphase.',
    instructionsFr: [
      'Réglez le siège et la plateforme de la presse à cuisses selon votre morphologie.',
      'Asseyez-vous dos bien calé contre le dossier, pieds sur la plateforme.',
      'Placez vos mains sur les poignées ou les côtés de la machine pour la stabilité.',
      'Poussez avec un pied sur la plateforme en tendant la jambe presque complètement.',
      'Marquez une pause, puis fléchissez lentement la jambe pour revenir à la position initiale.',
      'Répétez avec l\'autre jambe.',
      'Continuez en alternant les jambes pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_054': {
    descriptionFr: 'Variante de squat guidé. Excellent isolement des quadriceps.',
    instructionsFr: [
      'Réglez la machine hack squat à une position confortable pour votre taille.',
      'Placez vos pieds écartés à la largeur des épaules sur la plateforme, pointes légèrement vers l\'extérieur.',
      'Tenez les poignées pour la stabilité.',
      'Descendez en fléchissant genoux et hanches, dos droit et poitrine ouverte.',
      'Continuez jusqu\'à ce que les cuisses soient parallèles au sol ou légèrement en dessous.',
      'Marquez une pause, puis poussez dans les talons pour remonter à la position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_055': {
    descriptionFr: 'Isolation pure des quadriceps. Serrez en haut, contrôlez la phase négative.',
  },
  'ex_056': {
    descriptionFr: 'Constructeur d\'ischio-jambiers et de fessiers. Charnière de hanche, légère flexion des genoux.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules, pointes vers l\'avant.',
      'Tenez la barre en prise pronation, mains légèrement plus larges que les épaules.',
      'Penchez-vous aux hanches en gardant le dos droit et les genoux légèrement fléchis.',
      'Descendez la barre vers le sol en la gardant proche du corps.',
      'Sentez l\'étirement dans les ischio-jambiers pendant la descente.',
      'Une fois l\'étirement ressenti, poussez les hanches vers l\'avant et redressez-vous.',
      'Serrez les fessiers en haut du mouvement.',
      'Redescendez la barre à la position de départ et répétez.',
    ],
  },
  'ex_057': {
    descriptionFr: 'Isolation des ischio-jambiers. Variantes allongé, assis ou debout.',
    instructionsFr: [
      'Réglez la machine selon votre morphologie et sélectionnez le poids souhaité.',
      'Allongez-vous face contre le banc, jambes tendues, talons sous le coussin.',
      'Saisissez les poignées ou les côtés de la machine pour la stabilité.',
      'Buste immobile, expirez et fléchissez les jambes au maximum sans décoller les hanches du banc.',
      'Maintenez la contraction en serrant les ischio-jambiers.',
      'Inspirez et redescendez lentement à la position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_058': {
    descriptionFr: 'Accent sur l\'étirement des ischio-jambiers. Flexion des genoux minimale.',
  },
  'ex_059': {
    descriptionFr: 'Constructeur unilatéral de jambes. Pied arrière surélevé sur un banc.',
    instructionsFr: [
      'Debout, dos à un banc ou un support, pieds écartés à la largeur des épaules.',
      'Placez un pied derrière vous, le dessus du pied posé sur le banc.',
      'Fléchissez la jambe avant et descendez en fente, poitrine haute, genou aligné avec les orteils.',
      'Poussez dans le talon pour remonter à la position initiale.',
      'Répétez le nombre de répétitions souhaité, puis changez de jambe.',
    ],
  },
  'ex_060': {
    descriptionFr: 'Exercice fonctionnel pour les jambes. Avancez en fente, alternez.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules.',
      'Faites un pas en avant avec la jambe droite et descendez en position de fente.',
      'Gardez le buste droit et le genou avant aligné avec la cheville.',
      'Poussez sur le pied droit et avancez le pied gauche en fente.',
      'Continuez en alternant les jambes et en avançant à un rythme contrôlé.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_061': {
    descriptionFr: 'Meilleur exercice d\'isolation des fessiers. Dos sur un banc, poussez les hanches vers le haut.',
  },
  'ex_062': {
    descriptionFr: 'Squat idéal pour débuter. Tenez un haltère contre la poitrine.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules, tenez un haltère verticalement contre la poitrine à deux mains.',
      'Poitrine haute et gainage engagé, descendez en squat en poussant les hanches vers l\'arrière et en fléchissant les genoux.',
      'Continuez jusqu\'à ce que les cuisses soient parallèles au sol, ou aussi bas que confortable.',
      'Marquez une pause en bas, puis poussez dans les talons pour remonter.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_102': {
    descriptionFr: 'Soulevé de terre en position large. Plus d\'implication des quadriceps et des adducteurs que le conventionnel.',
  },
  'ex_103': {
    descriptionFr: 'Fente stationnaire ou arrière avec haltères. Excellent constructeur unilatéral de jambes.',
  },
  'ex_104': {
    descriptionFr: 'Montée sur banc ou box. Force unilatérale fonctionnelle.',
  },
  'ex_105': {
    descriptionFr: 'Activation des fessiers au poids du corps. Sur le dos, poussez les hanches vers le haut et serrez les fessiers.',
  },
  'ex_106': {
    descriptionFr: 'Charnière de hanche à la poulie. Excellent pour l\'activation des fessiers et ischio-jambiers.',
  },
  'ex_107': {
    descriptionFr: 'Barre sur le dos, flexion du buste vers l\'avant. Constructeur d\'ischio-jambiers et du bas du dos.',
  },
  'ex_108': {
    descriptionFr: 'Exercice excentrique pour ischio-jambiers. À genoux, descendre lentement le buste. Exercice d\'élite.',
  },
  'ex_109': {
    descriptionFr: 'Squat guidé à la Smith machine. Bon pour les débutants ou le travail lourd en isolation.',
  },
  'ex_110': {
    descriptionFr: 'Soulevé de terre en prise neutre. Plus axé quadriceps, moins de stress lombaire.',
  },
  'ex_111': {
    descriptionFr: 'Charnière de hanche explosive. La puissance vient des fessiers, pas des bras. Excellent pour le cardio.',
  },
  'ex_112': {
    descriptionFr: 'Squat sur une jambe en amplitude complète. Équilibre et force avancés.',
  },
  'ex_113': {
    descriptionFr: 'Maintien isométrique des quadriceps. Dos au mur, cuisses parallèles. Excellent pour finir une séance.',
  },
  'ex_114': {
    descriptionFr: 'Squat avec bande élastique. Marchez sur la bande, passez-la sur les épaules.',
  },
  'ex_127': {
    descriptionFr: 'Mouvement de squat fondamental. Amplitude complète, poitrine haute, poussez dans les talons.',
  },
  'ex_128': {
    descriptionFr: 'Fente en reculant. Alternative plus douce pour les genoux que la fente avant.',
  },
  'ex_129': {
    descriptionFr: 'Squat bulgare au poids du corps. Excellent constructeur unilatéral de quadriceps et fessiers.',
  },
  'ex_130': {
    descriptionFr: 'Squat explosif avec saut. Développement de la puissance et des quadriceps.',
  },
  'ex_131': {
    descriptionFr: 'Hip thrust unilatéral au sol. Excellent isolement des fessiers sans équipement.',
  },
  'ex_132': {
    descriptionFr: 'Sur le dos, glissez les pieds et ramenez. Leg curl au poids du corps pour les ischio-jambiers.',
  },
  'ex_133': {
    descriptionFr: 'Extension des mollets bilatérale au poids du corps sur une marche. Phase excentrique lente pour la croissance.',
  },

  // ═══════════════════════════════════════
  // LOWER LEGS (Calves)
  // ═══════════════════════════════════════
  'ex_063': {
    descriptionFr: 'Exercice principal pour les mollets. Amplitude complète, pause en haut et en bas.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules, barre posée sur le haut du dos.',
      'Montez sur la pointe des pieds aussi haut que possible.',
      'Marquez une pause en haut, puis redescendez lentement les talons à la position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_064': {
    descriptionFr: 'Cible le soléaire. Position genoux fléchis.',
    instructionsFr: [
      'Assis sur un banc, pieds à plat au sol, barre posée sur les cuisses.',
      'Placez l\'avant des pieds sur une surface surélevée, comme une cale ou une marche.',
      'Descendez les talons le plus bas possible en étirant les mollets.',
      'Montez les talons le plus haut possible en contractant les mollets.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_065': {
    descriptionFr: 'Exercice old school pour les mollets. Excellent étirement en bas du mouvement.',
    instructionsFr: [
      'Debout, pointes des pieds sur une surface surélevée comme une marche.',
      'Placez vos mains sur un support stable pour l\'équilibre.',
      'Montez les talons le plus haut possible en soulevant votre poids sur la pointe des pieds.',
      'Marquez une pause en haut, puis redescendez lentement les talons à la position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_066': {
    descriptionFr: 'Travail des mollets au poids du corps. Utilisez un mur pour l\'équilibre.',
    instructionsFr: [
      'Debout sur le bord d\'une marche, talons dans le vide et pointes sur la marche.',
      'Tenez un haltère d\'une main, l\'autre main en appui sur un mur pour l\'équilibre.',
      'Montez le talon le plus haut possible sur la pointe du pied.',
      'Marquez une pause en haut, puis redescendez lentement le talon sous le niveau de la marche.',
      'Répétez le nombre de répétitions souhaité, puis changez de jambe.',
    ],
  },
  'ex_115': {
    descriptionFr: 'Extension des mollets debout avec haltères. Constructeur de mollets pour le home gym.',
  },

  // ═══════════════════════════════════════
  // CORE (Waist)
  // ═══════════════════════════════════════
  'ex_067': {
    descriptionFr: 'Stabilité du tronc. Maintenir le corps droit, ne pas laisser les hanches s\'affaisser.',
  },
  'ex_068': {
    descriptionFr: 'Isolation des abdos supérieurs. Enrouler les épaules du sol, ne pas tirer sur la nuque.',
  },
  'ex_069': {
    descriptionFr: 'Exercice abdominal avancé. Suspendu à la barre, monter les jambes.',
    instructionsFr: [
      'Suspendez-vous à une barre de traction, bras tendus, paumes vers l\'avant.',
      'Contractez les abdos et montez les jambes devant vous en les gardant tendues.',
      'Continuez jusqu\'à ce que les jambes soient parallèles au sol ou aussi haut que possible.',
      'Marquez une pause en haut, puis redescendez lentement les jambes en position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_070': {
    descriptionFr: 'Travail abdominal lesté. À genoux dos à la poulie, enrouler le buste vers le bas.',
  },
  'ex_071': {
    descriptionFr: 'Travail des obliques. Assis, penché en arrière, rotation de chaque côté.',
    instructionsFr: [
      'Asseyez-vous au sol, genoux fléchis, pieds à plat.',
      'Penchez-vous légèrement en arrière en gardant le dos droit et les abdos contractés.',
      'Joignez les mains devant la poitrine ou tenez un poids si souhaité.',
      'Décollez les pieds du sol en vous équilibrant sur les ischions.',
      'Tournez le buste vers la droite, en amenant les mains ou le poids vers le côté droit.',
      'Marquez une pause, puis tournez le buste vers la gauche, en amenant les mains ou le poids vers le côté gauche.',
      'Continuez en alternant les côtés pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_072': {
    descriptionFr: 'Exercice de gainage avancé. Dérouler la roue vers l\'avant et revenir avec contrôle.',
  },
  'ex_073': {
    descriptionFr: 'Stabilité du tronc. Sur le dos, alterner l\'extension du bras et de la jambe opposés.',
    instructionsFr: [
      'Allongez-vous sur le dos, bras tendus vers le plafond.',
      'Pliez les genoux et levez les jambes en créant un angle de 90° aux hanches et aux genoux.',
      'Contractez les abdos pour plaquer le bas du dos au sol.',
      'Descendez lentement le bras droit et la jambe gauche vers le sol, en les gardant tendus, sans toucher le sol.',
      'Marquez une pause, puis revenez en position initiale.',
      'Répétez le mouvement avec le bras gauche et la jambe droite.',
      'Continuez en alternant les côtés pour le nombre de répétitions souhaité.',
    ],
  },
  'ex_074': {
    descriptionFr: 'Gainage dynamique et cardio. En position de planche, ramener les genoux vers la poitrine.',
    instructionsFr: [
      'Placez-vous en planche haute, mains sous les épaules, corps aligné.',
      'Contractez les abdos et ramenez le genou droit vers la poitrine, puis alternez rapidement avec le genou gauche.',
      'Continuez en alternant les jambes dans un mouvement de course, hanches basses et abdos gainés.',
      'Maintenez un rythme régulier et respirez de manière constante tout au long de l\'exercice.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_075': {
    descriptionFr: 'Stabilité des obliques. Pieds superposés ou décalés pour faciliter.',
  },
  'ex_076': {
    descriptionFr: 'Abdos rotationnels. Coude opposé vers le genou en pédalant.',
  },
  'ex_116': {
    descriptionFr: 'Exercice anti-rotation. Pousser le câble droit devant soi en résistant à la rotation.',
  },
  'ex_117': {
    descriptionFr: 'Puissance rotationnelle. Mouvement diagonal de haut en bas ou de bas en haut à la poulie.',
  },
  'ex_118': {
    descriptionFr: 'Abdos grande amplitude. Les mains et les pieds se rejoignent en haut, en forme de V.',
  },
  'ex_119': {
    descriptionFr: 'Sur le dos, alterner des battements de jambes de haut en bas. Brûlure des abdos inférieurs.',
  },
  'ex_120': {
    descriptionFr: 'Allongé à plat, monter les jambes tendues à 90°. Isolation des abdos inférieurs.',
  },
  'ex_121': {
    descriptionFr: 'Face au sol, lever les bras et les jambes simultanément. Bas du dos et chaîne postérieure.',
  },
  'ex_122': {
    descriptionFr: 'Gainage isométrique de gymnastique. Bras au-dessus de la tête, jambes tendues, bas du dos plaqué au sol.',
  },

  // ═══════════════════════════════════════
  // CARDIO
  // ═══════════════════════════════════════
  'ex_077': {
    descriptionFr: 'Échauffement cardio classique. Sauter en écartant bras et jambes.',
    instructionsFr: [
      'Debout, pieds joints, bras le long du corps.',
      'Sautez en écartant les pieds et en levant les bras au-dessus de la tête.',
      'À la réception, sautez immédiatement pour revenir en position initiale.',
      'Répétez le nombre de répétitions souhaité.',
    ],
  },
  'ex_078': {
    descriptionFr: 'Cardio full body. Squat, saut en arrière, pompe, saut en haut.',
    instructionsFr: [
      'Debout, pieds écartés à la largeur des épaules.',
      'Descendez en squat en posant les mains au sol devant vous.',
      'Lancez les pieds en arrière en position de pompe.',
      'Effectuez une pompe en gardant le corps aligné.',
      'Ramenez les pieds en position de squat.',
      'Sautez de manière explosive en levant les bras au-dessus de la tête.',
      'Réceptionnez en douceur et redescendez immédiatement en squat pour la répétition suivante.',
    ],
  },
  'ex_079': {
    descriptionFr: 'Course sur place avec montées de genoux. Excellent échauffement.',
  },
  'ex_080': {
    descriptionFr: 'Exercice pliométrique. Sauter sur la box, redescendre en pas.',
  },
  'ex_081': {
    descriptionFr: 'Outil de conditionnement. Vagues, frappes au sol, cercles.',
  },
  'ex_082': {
    descriptionFr: 'Cardio full body. Pousser avec les jambes, tirer avec les bras.',
  },
  'ex_083': {
    descriptionFr: 'Cardio classique à la corde. De nombreuses variantes possibles.',
    instructionsFr: [
      'Tenez les poignées de la corde, paumes vers l\'intérieur.',
      'Debout, pieds écartés à la largeur des épaules, genoux légèrement fléchis.',
      'Faites tourner la corde au-dessus de la tête et sautez par-dessus quand elle arrive aux pieds.',
      'Réceptionnez en douceur sur la pointe des pieds et répétez le saut au passage suivant.',
      'Continuez pendant la durée ou le nombre de répétitions souhaité.',
    ],
  },
  'ex_084': {
    descriptionFr: 'Course à effort maximal. Idéal pour le HIIT.',
  },
  'ex_123': {
    descriptionFr: 'Marche à quatre pattes sur les mains et les pieds. Conditionnement global et coordination.',
  },
  'ex_124': {
    descriptionFr: 'Course en continu ou par intervalles sur tapis de course.',
  },
  'ex_125': {
    descriptionFr: 'Cardio à faible impact. Idéal pour l\'échauffement ou le cardio basse intensité.',
  },
  'ex_126': {
    descriptionFr: 'Arraché explosif à un bras avec kettlebell. Puissance et conditionnement.',
  },
};
