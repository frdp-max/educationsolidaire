// Documents 27 et 28 : modification des statuts (protection de la gouvernance) et kit d'AGE.
// Le texte consolidé reprend mot pour mot les articles inchangés des statuts signés le 11 juillet 2026
// (documents/administratif/Statuts_Education_Solidaire.pdf).
const DATE = "___/___/2026";
const HOUR = "___h___";
const P = "Sabri TOUJANI", T = "Tahar BENHALIMA";

// ------------------------------------------------------------------ textes des articles modifiés
const ART5 = [
  ["h3", "Article 5 — Membres"],
  ["p", "L'association se compose de :"],
  ["ul", [
    "**Membres fondateurs** : Sabri TOUJANI et Tahar BENHALIMA. Ils sont membres du Conseil d'Administration de plein droit et à vie.",
    "**Membres d'honneur** : personnes physiques ou morales ayant rendu des services importants à l'association. Leur admission est prononcée par le Conseil d'Administration. Ils sont dispensés de cotisation.",
    "**Membres adhérents** : personnes physiques ou morales admises dans les conditions de l'article 6, qui adhèrent aux présents statuts, s'engagent à participer aux activités de l'association et s'acquittent de leur cotisation annuelle.",
  ]],
  ["p", "La qualité de membre est personnelle. Lorsqu'une formule de cotisation couvre plusieurs personnes (formule famille ou duo), elle ne confère la qualité de membre qu'aux personnes majeures nommément désignées lors de l'adhésion, dans la limite fixée par le règlement intérieur ; chacune d'elles dispose d'une voix."],
  ["p", "Les personnes qui soutiennent l'association par un don, ou dont la demande d'admission est en cours d'examen, sont des sympathisants : elles ne sont pas membres et ne disposent ni du droit de vote ni de l'éligibilité."],
];

const ART6 = [
  ["h3", "Article 6 — Admission"],
  ["p", "Pour faire partie de l'association, il faut être agréé par le Conseil d'Administration, qui statue souverainement sur les demandes d'admission présentées, dans le respect du principe de non-discrimination. Le refus d'admission n'a pas à être motivé."],
  ["p", "Le bulletin d'adhésion rempli et le versement de la cotisation, en ligne ou sur papier, valent **demande d'admission**. Le Conseil d'Administration statue au plus tard dans les trois mois qui suivent la réception de la demande ; il peut confier l'examen préalable des demandes au Bureau. La décision est notifiée par écrit ou par courriel. En cas de refus, la cotisation versée est intégralement remboursée."],
  ["p", "La qualité de membre adhérent prend effet à la date de la décision d'admission."],
];

const ART9 = [
  ["h3", "Article 9 — Conseil d'Administration (CA)"],
  ["p", "L'association est administrée par un Conseil d'Administration composé :"],
  ["ul", [
    "Des membres fondateurs (Sabri TOUJANI et Tahar BENHALIMA), membres de droit et à vie ;",
    "De **deux membres élus au plus** par l'Assemblée Générale Ordinaire parmi les membres adhérents de l'association, pour un mandat de 3 ans renouvelable.",
  ]],
  ["p", "Est éligible au Conseil d'Administration tout membre adhérent majeur, jouissant de ses droits civils, à jour de sa cotisation et membre de l'association depuis au moins un an à la date de l'Assemblée Générale. Les candidatures sont adressées par écrit au Président au moins dix jours avant l'Assemblée."],
  ["p", "Le nombre d'administrateurs élus ne peut excéder celui des membres fondateurs en fonction. Si ce nombre se trouve dépassé, aucune nouvelle élection n'a lieu tant que l'écart subsiste ; les mandats en cours vont à leur terme."],
  ["p", "Le Conseil d'Administration se réunit au moins une fois par an, sur convocation du Président ou à la demande de la moitié de ses membres. La présence de la moitié au moins de ses membres est nécessaire pour que le conseil puisse délibérer valablement. Les décisions sont prises à la majorité absolue des membres présents. La voix du Président est prépondérante en cas d'égalité."],
  ["p", "Le mandat d'un administrateur élu prend fin par l'arrivée de son terme, sa démission, la perte de la qualité de membre ou sa révocation par l'Assemblée Générale pour juste motif, l'intéressé ayant été mis en mesure de présenter sa défense."],
];

const ART10 = [
  ["h3", "Article 10 — Bureau"],
  ["p", "Le Conseil d'Administration élit parmi ses membres, pour un mandat de **trois ans** renouvelable, un Bureau composé au minimum de :"],
  ["ul", ["Un Président ;", "Un Trésorier."]],
  ["p", "Il pourra être complété ultérieurement par un Secrétaire et/ou un Vice-Président au fur et à mesure du développement de l'association et de l'intégration de nouveaux membres."],
  ["p", "Les fonctions de Président et de Trésorier ne peuvent pas être cumulées par la même personne. En revanche, le cumul d'autres fonctions du Bureau (par exemple Trésorier et Secrétaire) est autorisé si l'effectif de l'association le justifie."],
  ["p", "**Révocation du Président.** Le Président ne peut être révoqué de ses fonctions que pour motif grave, par une Assemblée Générale Extraordinaire convoquée spécialement à cet effet, statuant dans les conditions de quorum et de majorité renforcée prévues à l'article 13. Les griefs lui sont notifiés par écrit au moins quinze jours avant l'Assemblée ; il est entendu par elle, éventuellement assisté d'un membre de son choix, avant tout vote."],
  ["p", "**Révocation des autres membres du Bureau.** La révocation d'un autre membre du Bureau de ses fonctions de gestion interne peut être prononcée à tout moment par le Conseil d'Administration pour motif grave, à la majorité absolue de ses membres, après respect d'un délai de contradiction de 7 jours permettant à l'intéressé d'être entendu. En revanche, s'il s'agit d'un administrateur élu par l'Assemblée Générale, seul cet organe souverain dispose du pouvoir de révoquer son mandat d'administrateur au CA."],
  ["p", "**Vacance.** En cas de vacance d'un poste du Bureau, le Conseil d'Administration pourvoit au remplacement pour la durée du mandat restant à courir."],
];

const ART12 = [
  ["h3", "Article 12 — Assemblée Générale Ordinaire (AGO)"],
  ["p", "L'Assemblée Générale Ordinaire comprend tous les membres de l'association à jour de leurs obligations (fondateurs, d'honneur et adhérents). Elle se réunit au moins une fois par an, en présentiel ou par visioconférence, dans des conditions qui permettent l'identification des participants."],
  ["p", "**Droit de vote.** Prennent part aux votes les membres majeurs à jour de leur cotisation et membres de l'association depuis au moins **six mois** à la date de la convocation ; cette condition d'ancienneté ne s'applique pas aux membres fondateurs. Le Conseil d'Administration arrête, à la date de la convocation, la liste des membres appelés à voter, qui est tenue à la disposition des membres au siège."],
  ["p", "Elle est convoquée par le Président ou par la moitié des membres du Conseil d'Administration. La convocation est adressée par écrit ou par courrier électronique au moins **quinze jours** à l'avance. L'ordre du jour doit obligatoirement figurer sur la convocation. Seules les questions inscrites à l'ordre du jour peuvent faire l'objet d'un vote ; tout membre peut demander l'inscription d'une question par écrit au Président au moins dix jours avant l'Assemblée."],
  ["p", "L'AGO entend les rapports sur la gestion du Conseil d'Administration et la situation morale, examine le rapport financier du Trésorier, approuve les comptes de l'exercice clos, vote le budget prévisionnel de l'exercice suivant et pourvoit au renouvellement des membres élus du Conseil d'Administration."],
  ["p", "L'AGO délibère valablement si le quart au moins des membres appelés à voter est présent ou représenté. À défaut, une seconde Assemblée est convoquée avec le même ordre du jour, à quinze jours au moins d'intervalle ; elle délibère quel que soit le nombre de membres présents ou représentés."],
  ["p", "Les décisions sont prises à la majorité simple des voix exprimées des membres présents ou représentés."],
];

const ART13 = [
  ["h3", "Article 13 — Assemblée Générale Extraordinaire (AGE)"],
  ["p", "L'Assemblée Générale Extraordinaire est compétente pour statuer sur les modifications des statuts, la dissolution de l'association, les opérations immobilières majeures, la révocation du Président ou toute question de gouvernance exceptionnelle."],
  ["p", "Elle est valablement convoquée :"],
  ["ul", [
    "Sur décision du Président ;",
    "À la demande de la moitié des membres du Conseil d'Administration ;",
    "Ou à la demande écrite d'au moins 20 % des membres appelés à voter, signée par chacun d'eux et précisant les questions à inscrire à l'ordre du jour. Dans ce cas, le Président est tenu de convoquer l'AGE dans un délai de 30 jours à compter de la réception de la demande, sans qu'un droit de veto ou d'accord préalable du CA ne puisse y faire obstacle.",
  ]],
  ["p", "Les modalités de convocation, de droit de vote et de déroulement sont identiques à celles de l'AGO."],
  ["p", "**Quorum.** L'AGE ne délibère valablement que si la moitié au moins des membres appelés à voter est présente ou représentée. À défaut, une seconde AGE est convoquée avec le même ordre du jour, à quinze jours au moins d'intervalle ; elle délibère valablement si le quart au moins des membres appelés à voter est présent ou représenté."],
  ["p", "**Majorité.** Les décisions sont prises à la majorité qualifiée des deux tiers des voix exprimées des membres présents ou représentés."],
  ["p", "**Majorité renforcée.** La révocation du Président et toute modification des articles 5, 6, 9, 10, 12, 13 et 14 des présents statuts requièrent les voix favorables des deux tiers **de l'ensemble des membres appelés à voter**, et non des seules voix exprimées."],
];

const ART14 = [
  ["h3", "Article 14 — Gouvernance démocratique et droit de vote"],
  ["p", "Conformément aux principes intangibles de l'Économie Sociale et Solidaire (ESS) et de l'agrément ESUS, la gouvernance de l'association est démocratique :"],
  ["ul", [
    "En Assemblée Générale (Ordinaire et Extraordinaire), chaque membre appelé à voter (qu'il soit fondateur, adhérent ou d'honneur) dispose d'une seule voix délibérative selon le principe : « un membre = une voix ».",
    "Tout système de vote pondéré, de quota bloqué ou de plafond de voix est exclu.",
    "Le vote par procuration est autorisé au profit d'un autre membre appelé à voter. Un membre présent ne peut détenir plus d'**une (1)** procuration. La procuration est écrite, datée, signée et nominative ; elle est remise au Président au plus tard quarante-huit heures avant l'Assemblée. Les pouvoirs qui ne désignent pas de mandataire sont nuls.",
    "Les votes ont lieu à main levée. Le vote a lieu à bulletin secret pour l'élection ou la révocation d'une personne, ou dès qu'un membre présent le demande.",
  ]],
];

const ART21 = [
  ["h3", "Article 21 — Dispositions transitoires"],
  ["p", "Pour tenir compte de la création récente de l'association :"],
  ["ul", [
    "Pour les Assemblées Générales convoquées avant le 1er juillet 2027, l'ancienneté requise pour voter (article 12) est réduite à un mois ;",
    "Pour les élections au Conseil d'Administration organisées avant le 1er janvier 2028, l'ancienneté requise pour être éligible (article 9) est réduite à trois mois ;",
    "Le mandat du Bureau en fonction à la date d'adoption des présentes modifications est prorogé jusqu'à l'expiration d'un délai de trois ans à compter de cette date.",
  ]],
];

// ------------------------------------------------------------------ articles inchangés (texte signé)
const UNCHANGED_1_4 = [
  ["h2", "Titre I — Constitution, objet et durée"],
  ["h3", "Article 1 — Dénomination"],
  ["p", "Il est fondé entre les adhérents aux présents statuts une association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901, ayant pour dénomination : « Éducation Solidaire »."],
  ["h3", "Article 2 — Siège social"],
  ["p", "Le siège social est fixé à : 45, rue Henri Barbusse, 92230 Gennevilliers."],
  ["p", "Il pourra être transféré par simple décision du Conseil d'Administration, ratifiée par l'Assemblée Générale Ordinaire la plus proche."],
  ["h3", "Article 3 — Objet et utilité sociale"],
  ["p", "L'association « Éducation Solidaire », actrice de l'Économie Sociale et Solidaire (ESS), agit en faveur de la lutte contre les inégalités sociales, scolaires et éducatives. Elle a pour objet d'utilité sociale :"],
  ["ul", [
    "L'accompagnement des familles et des jeunes dans la prévention et la résolution des conflits éducatifs, ainsi que la promotion du respect mutuel ;",
    "L'accompagnement des enfants pour mieux comprendre leurs parents ;",
    "L'aide aux parents pour mieux respecter et comprendre leurs enfants ;",
    "La médiation en cas de conflits éducatifs et scolaires ;",
    "La tenue d'une permanence d'écoute et d'aide 7 jours sur 7 ;",
    "La proposition d'un lieu de socialisation et d'écoute où les jeunes peuvent se poser ;",
    "L'organisation de sorties et d'activités éducatives ;",
    "L'orientation des usagers vers les services sociaux et scolaires compétents ;",
    "La mise à l'abri et l'assistance d'urgence temporaire (repas et hébergement de secours de premier niveau) pour les personnes ou familles en situation de détresse aiguë, en lien étroit avec les services sociaux de la commune ;",
    "La formation et la sensibilisation des parents et des professionnels du secteur ;",
    "L'accompagnement, l'orientation et la mise à l'abri d'urgence des femmes victimes de violences intra-familiales.",
  ]],
  ["p", "L'association peut exercer toute activité économique se rattachant directement ou indirectement à son objet social, sous réserve des autorisations légales requises. Les excédents générés par ces activités sont intégralement réinvestis dans la réalisation de cet objet social."],
  ["h3", "Article 4 — Durée"],
  ["p", "La durée de l'association est indéterminée."],
];

const ART7_8 = [
  ["h3", "Article 7 — Cotisations"],
  ["p", "Les membres adhérents s'acquittent d'une cotisation annuelle. Le montant et les conditions de versement de cette cotisation sont fixés chaque année par le Conseil d'Administration. Les membres fondateurs et d'honneur en sont exemptés de plein droit."],
  ["h3", "Article 8 — Radiation"],
  ["p", "La qualité de membre se perd par :"],
  ["ul", [
    "Le décès de la personne physique ou la dissolution de la personne morale ;",
    "La démission adressée par écrit (courrier ou email) au Président de l'association ;",
    "La radiation prononcée par le Conseil d'Administration pour non-paiement de la cotisation ou pour motif grave. Dans ce cas, l'intéressé doit être invité par écrit, au moins 7 jours avant la réunion du CA, à présenter sa défense. La décision est prise à la majorité absolue des membres présents du CA, la voix du Président étant prépondérante en cas d'égalité.",
  ]],
];

const ART11 = [
  ["h3", "Article 11 — Rôle du Président"],
  ["p", "Le Président représente l'association dans tous les actes de la vie civile. Il ordonne les dépenses, veille au bon fonctionnement de l'association et dispose de la signature sociale. Il peut déléguer par écrit une partie de ses pouvoirs à un autre membre du Bureau."],
];

const TITLE_V_VII = [
  ["h2", "Titre V — Ressources, transparence et lucrativité limitée"],
  ["h3", "Article 15 — Ressources"],
  ["p", "Les ressources de l'association comprennent :"],
  ["ul", [
    "Les cotisations des membres adhérents ;",
    "Les subventions de l'État, des collectivités territoriales (notamment la Ville de Gennevilliers, le Département des Hauts-de-Seine et la Région Île-de-France), des établissements publics ou de l'Union Européenne ;",
    "Les dons, legs, parrainages et mécénats privés ;",
    "Les recettes issues de ses activités économiques et des prestations fournies par l'association ;",
    "Toutes autres ressources autorisées par les lois et règlements en vigueur.",
  ]],
  ["h3", "Article 15 bis — Affectation des bénéfices et réserves impartageables"],
  ["p", "Les excédents financiers générés par l'association sont intégralement et obligatoirement affectés à la constitution de réserves de sécurité et au développement de son objet social d'utilité sociale. Aucune distribution de bénéfices, de dividendes, d'excédents de gestion ou de part d'actif aux membres (qu'ils soient fondateurs, adhérents ou d'honneur) n'est autorisée. Les réserves constituées sont impartageables de manière définitive."],
  ["h3", "Article 16 — Conditions de rémunération (Conformité ESUS)"],
  ["p", "Conformément aux critères stricts d'encadrement des rémunérations définis par l'agrément ESUS (Entreprise Solidaire d'Utilité Sociale) :"],
  ["ol", [
    "Les fonctions d'administration et de direction exercées par les membres du Conseil d'Administration et du Bureau sont gratuites et bénévoles. Seuls les frais réels et justifiés occasionnés par l'accomplissement de leur mandat sont remboursés, sur présentation de justificatifs et après validation du Bureau.",
    "Si l'association recrute ultérieurement des salariés pour mener à bien ses actions d'utilité sociale : la rémunération moyenne versée, primes et avantages compris, aux 5 salariés ou dirigeants salariés les mieux rémunérés ne peut excéder un plafond annuel fixé à 7 fois le SMIC ; la rémunération individuelle la plus élevée versée à un salarié de l'association ne peut excéder un plafond annuel fixé à 10 fois le SMIC.",
  ]],
  ["h2", "Titre VI — Dissolution et dévolution"],
  ["h3", "Article 17 — Dissolution"],
  ["p", "La dissolution de l'association ne peut être prononcée qu'en Assemblée Générale Extraordinaire convoquée spécialement à cet effet, à la majorité des deux tiers des voix exprimées des membres présents ou représentés."],
  ["p", "En cas de dissolution, un ou plusieurs liquidateurs sont nommés par l'AGE. L'actif net subsistant après reprise des apports éventuels ne peut être dévolu à aucun membre de l'association, même partiellement. Cet actif net sera obligatoirement dévolu à une ou plusieurs associations, fondations ou organismes poursuivant un objet similaire et partageant les principes de l'Économie Sociale et Solidaire, conformément à l'article 9 de la loi du 1er juillet 1901 et à la loi ESS du 31 juillet 2014."],
  ["h2", "Titre VII — Dispositions diverses"],
  ["h3", "Article 18 — Règlement intérieur"],
  ["p", "Un règlement intérieur peut être rédigé par le Conseil d'Administration pour fixer les détails d'exécution des présents statuts et l'organisation pratique de l'association. Il est soumis à l'approbation de l'Assemblée Générale Ordinaire la plus proche."],
  ["h3", "Article 19 — Engagement Économie Sociale et Solidaire (ESS)"],
  ["p", "L'association s'engage formellement à respecter l'ensemble des critères cumulatifs de l'article 1er de la loi n° 2014-856 du 31 juillet 2014 relative à l'économie sociale et solidaire (ESS), lui permettant de plein droit de postuler aux financements spécifiques du secteur et à l'agrément ESUS, à savoir :"],
  ["ul", [
    "La poursuite d'un but d'utilité sociale comme objet principal ;",
    "Une gouvernance démocratique participative caractérisée par le principe « un membre = une voix » ;",
    "Une lucrativité limitée caractérisée par l'interdiction de distribuer ses bénéfices et le réinvestissement systématique de ses résultats de gestion.",
  ]],
  ["h3", "Article 20 — Formalités"],
  ["p", "Le Président ou tout membre du Conseil d'Administration chargé par lui est chargé d'accomplir toutes les formalités de déclaration en préfecture et de publication au Journal Officiel des Associations et Fondations d'Entreprises (JOAFE) requises par la loi."],
  ["p", `Les présents statuts ont été adoptés à l'unanimité par l'Assemblée Générale Constitutive réunie à Gennevilliers, le 11 juillet 2026, et modifiés par l'Assemblée Générale Extraordinaire du ${DATE}.`],
];

// ------------------------------------------------------------------ tableau comparatif
const CHANGES = [
  ["5", "Trois catégories de membres ; rien sur les formules famille/duo ni sur les donateurs", "Qualité de membre personnelle ; formule famille = personnes majeures désignées, une voix chacune ; donateurs et demandes en attente = sympathisants sans vote", "Éviter les voix « fantômes » et l'ambiguïté du Pass Famille / Duo"],
  ["6", "Admission agréée souverainement par le CA", "Le paiement HelloAsso vaut demande d'admission ; décision sous 3 mois ; remboursement en cas de refus ; non-discrimination", "Rendre le filtre d'admission opposable et transparent pour les adhérents"],
  ["9", "Nombre d'administrateurs élus illimité ; aucune condition d'éligibilité", "2 élus au plus, jamais plus que les fondateurs ; éligibilité après 1 an d'adhésion ; candidatures 10 jours avant", "Empêcher une majorité d'élus de renverser le Bureau"],
  ["10", "Bureau élu pour 1 an ; tout membre du Bureau, Président compris, révocable par le CA", "Bureau élu pour 3 ans ; Président révocable seulement par une AGE à majorité renforcée, griefs notifiés 15 jours avant", "Retirer au CA le pouvoir de révoquer seul le Président"],
  ["12", "Convocation 7 jours ; tout membre à jour vote ; pas de quorum", "Convocation 15 jours ; vote après 6 mois d'adhésion ; liste des votants arrêtée à la convocation ; quorum d'un quart", "Neutraliser les adhésions massives de dernière minute"],
  ["13", "20 % des adhérents peuvent imposer une AGE ; 2/3 des voix exprimées ; pas de quorum", "Demande signée et motivée ; quorum de moitié (un quart en seconde convocation) ; 2/3 des membres inscrits pour la révocation du Président et les articles clés", "Une AGE peu fréquentée ne peut plus réécrire la gouvernance"],
  ["14", "2 procurations par présent", "1 procuration nominative, remise 48 h avant ; pouvoirs en blanc nuls ; bulletin secret sur demande", "Freiner la collecte de voix"],
  ["21 (nouveau)", "—", "Ancienneté réduite tant que l'association est jeune ; prorogation du Bureau en place", "Permettre l'AGO d'élargissement prévue sans attendre un an"],
];

module.exports = [
  // ------------------------------------------------------------------ 27
  {
    code: "27", file: "Projet_de_statuts_modifies", kicker: "Gouvernance · Assemblée Générale Extraordinaire · article 13 des statuts",
    title: "Projet de statuts modifiés",
    meta: `Projet soumis à l'AGE du ${DATE} · Modifie les articles 5, 6, 9, 10, 12, 13 et 14, ajoute l'article 21 · Texte consolidé en partie 2`,
    blocks: [
      ["box", [
        "**Objet.** Sécuriser la gouvernance contre une prise de contrôle soudaine (adhésions massives avant une assemblée, collecte de procurations, majorité d'administrateurs élus), sans renoncer au principe « un membre = une voix » inscrit aux articles 14 et 19 ni aux critères de l'agrément ESUS.",
        "**Ce projet n'est pas un avis juridique.** Le faire relire par un juriste associatif, par exemple le Point d'appui à la vie associative des Hauts-de-Seine, avant de convoquer l'AGE.",
      ], "warm"],
      ["h1", "1. Tableau des modifications"],
      ["table", ["Art.", "Rédaction actuelle", "Nouvelle rédaction", "Pourquoi"], CHANGES, [700, 2700, 3700, 2538]],
      ["h2", "Ce que le projet ne change pas"],
      ["ul", [
        "Le principe « un membre = une voix » et l'interdiction des votes pondérés et des quotas bloqués (articles 14 et 19).",
        "Le droit de 20 % des membres d'imposer une AGE dans les 30 jours, sans veto possible du CA (article 13).",
        "Le pouvoir souverain de l'Assemblée Générale de révoquer les administrateurs qu'elle a élus (articles 9 et 10).",
        "L'objet, les ressources, la lucrativité limitée, la rémunération et la dissolution (articles 3, 15 à 17).",
      ]],
      ["h2", "Points à trancher avant la convocation"],
      ["checks", [
        "**Nombre d'administrateurs élus** : 2 garde aux fondateurs la moitié du CA (voix prépondérante du Président en cas d'égalité). Le kit d'AGO (document 26) prévoit l'élection de **trois** administrateurs : à ramener à deux.",
        "**Ancienneté** : 6 mois pour voter et 1 an pour être éligible, avec des délais réduits jusqu'en 2027 (article 21). Ajuster si besoin.",
        "**Membres déjà admis** : vérifier au registre et aux PV du CA si des adhérents HelloAsso ont été agréés. Si oui, ils sont membres et doivent être convoqués à l'AGE (voir document 28).",
        "**Règlement intérieur** (document 10) : l'aligner après l'AGE (procurations, délais, article cité pour les admissions, Pass Famille / Duo).",
      ]],
      ["break"],
      ["h1", "2. Texte consolidé des statuts"],
      ["small", "Les articles modifiés ou ajoutés sont signalés par un astérisque (*) dans leur titre. Les autres reprennent mot pour mot les statuts signés le 11 juillet 2026."],
      ["center", "STATUTS DE L'ASSOCIATION « ÉDUCATION SOLIDAIRE »"],
      ["small", "Association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901, pleinement conforme aux exigences de l'Économie Sociale et Solidaire (ESS) ainsi qu'à l'agrément ESUS. Statuts adoptés le 11 juillet 2026, modifiés par l'Assemblée Générale Extraordinaire du ___/___/2026."],
      ...UNCHANGED_1_4,
      ["h2", "Titre II — Composition et adhésion"],
      ...ART5.map((b, i) => (i === 0 ? ["h3", "Article 5 — Membres *"] : b)),
      ...ART6.map((b, i) => (i === 0 ? ["h3", "Article 6 — Admission *"] : b)),
      ...ART7_8,
      ["h2", "Titre III — Administration et fonctionnement"],
      ...ART9.map((b, i) => (i === 0 ? ["h3", "Article 9 — Conseil d'Administration (CA) *"] : b)),
      ...ART10.map((b, i) => (i === 0 ? ["h3", "Article 10 — Bureau *"] : b)),
      ...ART11,
      ["h2", "Titre IV — Assemblées Générales"],
      ...ART12.map((b, i) => (i === 0 ? ["h3", "Article 12 — Assemblée Générale Ordinaire (AGO) *"] : b)),
      ...ART13.map((b, i) => (i === 0 ? ["h3", "Article 13 — Assemblée Générale Extraordinaire (AGE) *"] : b)),
      ...ART14.map((b, i) => (i === 0 ? ["h3", "Article 14 — Gouvernance démocratique et droit de vote *"] : b)),
      ...TITLE_V_VII,
      ...ART21.map((b, i) => (i === 0 ? ["h3", "Article 21 — Dispositions transitoires *"] : b)),
      ["space", 200],
      ["p", "Fait à Gennevilliers, le ___/___/2026, en trois exemplaires originaux."],
      ["sign", [`Le Président — ${P}`, `Le Trésorier — ${T}`]],
    ],
  },
  // ------------------------------------------------------------------ 28
  {
    code: "28", file: "Kit_AGE_modification_des_statuts", kicker: "Gouvernance · articles 12 à 14 des statuts actuels",
    title: "Kit d'Assemblée Générale Extraordinaire",
    meta: "Convocation · Pouvoir · Feuille de présence · Procès-verbal et résolutions · Formalités · Pour l'adoption des statuts modifiés (document 27)",
    blocks: [
      ["box", [
        "**L'AGE se tient selon les statuts encore en vigueur** (ceux du 11 juillet 2026) : convocation par le Président au moins **7 jours** avant, par écrit ou courriel, avec l'ordre du jour ; majorité des **deux tiers des voix exprimées** ; deux procurations au plus par membre présent ; aucun quorum.",
        "**Qui convoquer ?** Tous les membres : les deux fondateurs, les membres d'honneur et **chaque adhérent agréé par le CA**. Oublier un membre expose l'AGE à une annulation. Joindre à la convocation le projet de statuts modifiés (document 27).",
      ], "warm"],
      ["h1", "1. Convocation"],
      ["p", "Gennevilliers, le [date — au moins 7 jours avant l'Assemblée]"],
      ["p", "Madame, Monsieur, chère adhérente, cher adhérent,"],
      ["p", `Vous êtes convoqué(e) à l'**Assemblée Générale Extraordinaire** de l'association UNISSON — Association Éducation Solidaire, qui se tiendra le ${DATE} à ${HOUR}, au [lieu ou lien de visioconférence], avec l'ordre du jour suivant :`],
      ["ol", [
        "Présentation du projet de modification des statuts",
        "Modification des articles 5 et 6 (membres et admission)",
        "Modification de l'article 9 (Conseil d'Administration)",
        "Modification de l'article 10 (Bureau et révocation du Président)",
        "Modification des articles 12 et 13 (Assemblées Générales)",
        "Modification de l'article 14 (droit de vote et procurations)",
        "Ajout de l'article 21 (dispositions transitoires) et mise à jour de l'article 20",
        "Adoption du texte consolidé des statuts",
        "Pouvoirs pour l'accomplissement des formalités",
      ]],
      ["p", "Le projet de statuts modifiés, avec un tableau comparant l'ancienne et la nouvelle rédaction, est joint à la présente convocation. Si vous ne pouvez pas être présent(e), vous pouvez donner pouvoir à un autre membre au moyen du formulaire joint (deux pouvoirs au plus par membre présent)."],
      ["p", `${P}, Président`],
      ["h1", "2. Pouvoir"],
      ["p", "Je soussigné(e) ______________________________, membre de l'association, donne pouvoir à ______________________________, membre de l'association, pour me représenter à l'Assemblée Générale Extraordinaire du ___/___/2026, prendre part aux délibérations et voter en mon nom sur les questions inscrites à l'ordre du jour."],
      ["p", "Fait à ______________, le ___/___/2026 — signature précédée de la mention « Bon pour pouvoir » :"],
      ["space", 500],
      ["break"],
      ["h1", "3. Feuille de présence"],
      ["p", `Assemblée Générale Extraordinaire du ${DATE}`],
      ["table", ["Nom et prénom", "Qualité (fondateur, honneur, adhérent)", "Signature", "Pouvoir reçu de", "Signature"], [
        [P, "Fondateur", "", "", ""],
        [T, "Fondateur", "", "", ""],
        ...Array.from({ length: 10 }, () => ["", "", "", "", ""]),
      ], [2600, 1700, 1700, 2100, 1538]],
      ["fields", ["Membres de l'association à la date de la convocation", "Membres présents", "Membres représentés", "Total des voix"]],
      ["break"],
      ["h1", "4. Procès-verbal"],
      ["p", `Le ${DATE} à ${HOUR}, les membres de l'association se sont réunis en Assemblée Générale Extraordinaire au [lieu], sur convocation du Président adressée le ${DATE} conformément aux articles 12 et 13 des statuts. ______ membres sont présents et ______ représentés, soit ______ voix sur ______ membres, d'après la feuille de présence annexée. L'Assemblée est présidée par ${P} ; ______________________ est désigné(e) secrétaire de séance.`],
      ["p", "Le Président présente le projet de statuts modifiés joint à la convocation : stabiliser la gouvernance pendant le lancement et encadrer l'admission et les assemblées, dans le respect du principe « un membre = une voix ». Chaque résolution requiert les deux tiers des voix exprimées (article 13 des statuts en vigueur)."],
      ["h3", "Résolution 1 — Membres et admission (articles 5 et 6)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte la nouvelle rédaction des articles 5 et 6 des statuts telle qu'elle figure au projet joint à la convocation. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 2 — Conseil d'Administration (article 9)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte la nouvelle rédaction de l'article 9 des statuts, qui limite à deux le nombre d'administrateurs élus et fixe les conditions d'éligibilité. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 3 — Bureau et révocation du Président (article 10)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte la nouvelle rédaction de l'article 10 des statuts, qui porte à trois ans le mandat du Bureau et confie la révocation du Président à l'Assemblée Générale Extraordinaire. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 4 — Assemblées Générales (articles 12 et 13)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte la nouvelle rédaction des articles 12 et 13 des statuts (droit de vote, délai de convocation, quorum et majorités). Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 5 — Droit de vote et procurations (article 14)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte la nouvelle rédaction de l'article 14 des statuts. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 6 — Dispositions transitoires et formalités (articles 20 et 21)"],
      ["p", "L'Assemblée Générale Extraordinaire adopte l'article 21 nouveau et la mise à jour de l'article 20 des statuts. Elle constate que le mandat du Bureau en fonction, composé de M. Sabri TOUJANI, Président, et de M. Tahar BENHALIMA, Trésorier et Secrétaire, est prorogé dans les conditions de l'article 21. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 7 — Adoption du texte consolidé"],
      ["p", "En conséquence des résolutions qui précèdent, l'Assemblée Générale Extraordinaire adopte le texte consolidé des statuts annexé au présent procès-verbal, qui se substitue aux statuts du 11 juillet 2026 à compter de ce jour. Pour ___ · contre ___ · abstention ___."],
      ["h3", "Résolution 8 — Pouvoirs"],
      ["p", "L'Assemblée Générale Extraordinaire donne tous pouvoirs au Président, avec faculté de délégation à tout membre du Conseil d'Administration, pour déclarer la modification des statuts en préfecture et accomplir toutes les formalités nécessaires. Pour ___ · contre ___ · abstention ___."],
      ["p", "Questions diverses : ____________________________________________________________ L'ordre du jour étant épuisé, la séance est levée à ___h___."],
      ["sign", [`Le Président — ${P}`, "Le secrétaire de séance"]],
      ["h1", "5. Après l'Assemblée"],
      ["checks", [
        "Faire signer le texte consolidé par le Président et le Trésorier (paraphe sur chaque page), en trois exemplaires originaux.",
        "Reporter la modification et sa date au **registre spécial** (document 04).",
        "**Déclarer la modification en préfecture dans les trois mois**, en ligne sur le compte de l'association (Le Compte Asso ou service-public.fr, rubrique « Modification d'une association ») : joindre les statuts modifiés signés et le procès-verbal de l'AGE.",
        "Classer le procès-verbal signé, la feuille de présence et les pouvoirs dans le coffre-fort documentaire.",
        "Aligner le **règlement intérieur** (document 10) sur les nouveaux articles, puis le faire approuver par l'AGO suivante.",
        "Ramener à deux le nombre d'administrateurs à élire dans le kit d'AGO (document 26).",
        "Mettre à jour le site : extrait des statuts (/statuts), FAQ « adhésion » et conditions générales (l'adhésion en ligne vaut demande d'admission ; le droit de vote s'acquiert après la durée d'adhésion prévue).",
        "Informer les adhérents existants des nouvelles règles par courriel, avec le texte consolidé.",
      ]],
    ],
  },
];
