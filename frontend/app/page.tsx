import { KpiCard } from "@/components/KpiCard";
import { TableCard } from "@/components/TableCard";
import { VariantSwitcher } from "@/components/VariantSwitcher";
import {
  API_VARIANTS,
  ApiVariantKey,
  fetchCategories,
  fetchItems,
  fetchItemsByCategory
} from "@/lib/api";
import Link from "next/link";

const attentionPoints = [
  {
    title: "N+1",
    details:
      "Exposer deux modes internes (flag env) : mode JOIN FETCH et projection DTO pour /items?."
  },
  {
    title: "Pagination",
    details: "Requêtes identiques (page/size constants)."
  },
  {
    title: "Validation",
    details: "Bean Validation activée de façon homogène."
  },
  {
    title: "Sérialisation",
    details: "Via Jackson, payloads alignés."
  },
  {
    title: "Service unique",
    details: "Un seul service lançé pendant les mesures."
  }
];

const t0ConfigRows = [
  { element: "Machine (CPU, coeurs, RAM)", valeur: "—" },
  { element: "OS / Kernel", valeur: "—" },
  { element: "Java version", valeur: "—" },
  { element: "Docker/Compose versions", valeur: "—" },
  { element: "PostgreSQL version", valeur: "—" },
  { element: "JMeter version", valeur: "—" },
  { element: "Prometheus / Grafana / InfluxDB", valeur: "—" },
  { element: "JVM flags (Xms/Xmx, GC)", valeur: "—" },
  { element: "HikariCP (min/max/timeout)", valeur: "—" }
];

const t1ScenarioRows = [
  {
    scenario: "READ-heavy (relation)",
    mix: "50% GET /items?page=&size=50 ; 20% GET /items?categoryId=&page=&size= ; 20% GET /categories ; 10% GET /categories/{id}/items",
    threads: "50➜100➜200",
    rampup: "60 s",
    duree: "10 min",
    payload: "—"
  },
  {
    scenario: "JOIN-filter ciblé",
    mix: "70% GET /items?categoryId=&page=&size= ; 30% GET /items/{id}",
    threads: "60➜120 (8 min/palier)",
    rampup: "60 s",
    duree: "8 min/palier",
    payload: "—"
  },
  {
    scenario: "MIXED (2 entités)",
    mix: "40% GET /items?page=? ; 20% POST /items (JSON 1 KB) ; 10% DELETE /items/{id} ; 10% PUT /items/{id} ; 10% GET /categories ; 10% POST /categories",
    threads: "50➜100",
    rampup: "60 s",
    duree: "10 min/palier",
    payload: "1 KB"
  },
  {
    scenario: "HEAVY-body (payloads 5 KB)",
    mix: "50% POST /items (5 KB) ; 50% POST /items/{id} (5 KB)",
    threads: "30➜60",
    rampup: "60 s",
    duree: "8 min/palier",
    payload: "5 KB"
  }
];

const t2ResultRows = [
  { scenario: "READ-heavy", mesure: "RPS", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "READ-heavy", mesure: "p50 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "READ-heavy", mesure: "p95 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "READ-heavy", mesure: "p99 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "READ-heavy", mesure: "Err %", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "JOIN-filter", mesure: "RPS", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "JOIN-filter", mesure: "p50 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "JOIN-filter", mesure: "p95 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "JOIN-filter", mesure: "p99 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "JOIN-filter", mesure: "Err %", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "MIXED (2 entités)", mesure: "RPS", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "MIXED (2 entités)", mesure: "p50 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "MIXED (2 entités)", mesure: "p95 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "MIXED (2 entités)", mesure: "p99 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "MIXED (2 entités)", mesure: "Err %", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "HEAVY-body", mesure: "RPS", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "HEAVY-body", mesure: "p50 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "HEAVY-body", mesure: "p95 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "HEAVY-body", mesure: "p99 (ms)", variantA: "—", variantC: "—", variantD: "—" },
  { scenario: "HEAVY-body", mesure: "Err %", variantA: "—", variantC: "—", variantD: "—" }
];

const t3ResourceRows = [
  { variant: "A : Jersey", cpu: "—", heap: "—", gc: "—", threads: "—", hikari: "—" },
  { variant: "C : @RestController", cpu: "—", heap: "—", gc: "—", threads: "—", hikari: "—" },
  { variant: "D : Spring Data REST", cpu: "—", heap: "—", gc: "—", threads: "—", hikari: "—" }
];

const t4JoinRows = [
  {
    endpoint: "GET /items?categoryId=",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "GET /categories/{id}/items",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  }
];

const t5MixedRows = [
  {
    endpoint: "GET /items",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "POST /items",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "PUT /items/{id}",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "DELETE /items/{id}",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "GET /categories",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  },
  {
    endpoint: "POST /categories",
    variantA: "—",
    variantC: "—",
    variantD: "—",
    rps: "—",
    p95: "—",
    err: "—",
    observations: ""
  }
];

const t6IncidentRows = [
  { run: "—", variant: "—", type: "—", cause: "", action: "" }
];

const t7SummaryRows = [
  { criteres: "Débit global (RPS)", best: "", gap: "", comments: "" },
  { criteres: "Latence p95", best: "", gap: "", comments: "" },
  { criteres: "Stabilité (erreurs)", best: "", gap: "", comments: "" },
  { criteres: "Empreinte CPU/RAM", best: "", gap: "", comments: "" },
  {
    criteres: "Facilité d'expo relationnelle",
    best: "",
    gap: "",
    comments: ""
  }
];

const numberFormatter = new Intl.NumberFormat("fr-FR");
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short"
});

const VARIANT_KEYS = Object.keys(API_VARIANTS) as ApiVariantKey[];

function resolveVariantKey(
  value?: string | string[]
): ApiVariantKey {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized && VARIANT_KEYS.includes(normalized as ApiVariantKey)) {
    return normalized as ApiVariantKey;
  }
  return "restcontroller";
}

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const variantKey = resolveVariantKey(searchParams?.variant);
  const variantConfig = API_VARIANTS[variantKey];
  const displayBaseUrl = variantConfig.baseUrl;
  const internalBaseUrl = variantConfig.internalBaseUrl;
  let categoriesPage = null;
  let itemsPage = null;
  let relationPage = null;
  let errorMessage: string | null = null;

  try {
    const [categoriesResponse, itemsResponse] = await Promise.all([
      fetchCategories({
        page: 0,
        size: 200,
        variant: variantKey,
        baseUrl: internalBaseUrl
      }),
      fetchItems({
        page: 0,
        size: 200,
        variant: variantKey,
        baseUrl: internalBaseUrl
      })
    ]);

    categoriesPage = categoriesResponse;
    itemsPage = itemsResponse;

    if (categoriesResponse.content.length > 0) {
      relationPage = await fetchItemsByCategory(
        categoriesResponse.content[0].id,
        {
          page: 0,
          size: 200,
          variant: variantKey,
          baseUrl: internalBaseUrl
        }
      );
    }
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Erreur inattendue.";
  }

  const categories = categoriesPage?.content ?? [];
  const items = itemsPage?.content ?? [];
  const relationItems = relationPage?.content ?? [];

  const totalCategories =
    categoriesPage?.totalElements ?? categories.length ?? 0;
  const totalItems = itemsPage?.totalElements ?? items.length ?? 0;
  const totalStock = items.reduce((acc, item) => acc + (item.stock ?? 0), 0);

  const averagePrice =
    items.length > 0
      ? items.reduce((sum, item) => sum + Number(item.price ?? 0), 0) /
        items.length
      : 0;

  const itemsByCategory = items.reduce<Record<number, number>>((acc, item) => {
    if (item.categoryId != null) {
      acc[item.categoryId] = (acc[item.categoryId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const stockByCategory = items.reduce<Record<number, number>>((acc, item) => {
    if (item.categoryId != null) {
      acc[item.categoryId] =
        (acc[item.categoryId] ?? 0) + Number(item.stock ?? 0);
    }
    return acc;
  }, {});

  const topStockItems = [...items]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  const apiSnapshotRows = [
    {
      element: "Variante sélectionnée",
      valeur: variantConfig.label
    },
    {
      element: "Base URL",
      valeur: displayBaseUrl
    },
    {
      element: "Catégories chargées",
      valeur: numberFormatter.format(totalCategories)
    },
    {
      element: "Articles chargés",
      valeur: numberFormatter.format(totalItems)
    },
    {
      element: "Stock cumulé",
      valeur: numberFormatter.format(totalStock)
    },
    {
      element: "Dernière mise à jour catégorie",
      valeur:
        categories.length > 0
          ? dateTimeFormatter.format(new Date(categories[0].updatedAt))
          : "—"
    }
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-wide text-primary-600">
              Benchmark de performances des Web Services REST
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Tableau de bord de pilotage
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600">
              Visualisez et complétez les indicateurs clefs pour comparer les
              variantes A (Jersey), C (@RestController) et D (Spring Data REST) à
              partir de vos campagnes JMeter, Prometheus et analyses.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <VariantSwitcher current={variantKey} />
            <Link
              href={`/seed?variant=${variantKey}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              Ajouter des données
            </Link>
          </div>
        </div>
      </header>

      {errorMessage ? (
        <section className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erreur lors du chargement des données</p>
          <p className="text-sm">{errorMessage}</p>
          <p className="mt-2 text-xs text-red-600">
            Vérifiez que les services backend sont accessibles et que les
            variables NEXT_PUBLIC_* pointent vers les bonnes URL.
          </p>
        </section>
      ) : null}

      <section className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Catégories disponibles"
          value={numberFormatter.format(totalCategories)}
          description="Données issues de GET /api/categories"
        />
        <KpiCard
          label="Articles en catalogue"
          value={numberFormatter.format(totalItems)}
          description="Résultat de GET /api/items"
        />
        <KpiCard
          label="Stock cumulé"
          value={numberFormatter.format(totalStock)}
          description="Somme du champ stock pour chaque item"
        />
        <KpiCard
          label="Prix moyen"
          value={currencyFormatter.format(averagePrice || 0)}
          description="Moyenne du prix des articles"
        />
      </section>

      <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-primary-700">
          Points d&apos;attention (comparabilité)
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {attentionPoints.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <p className="font-semibold text-slate-800">{point.title}</p>
              <p className="text-sm text-slate-600">{point.details}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-8">
        <TableCard
          title="T0 — Configuration matérielle & logicielle"
          description="Tableau à compléter pour documenter l'environnement de test utilisé."
          columns={[
            { key: "element", label: "Élément" },
            { key: "valeur", label: "Valeur" }
          ]}
          data={t0ConfigRows}
        />
        <TableCard
          title="T1 — Scénarios JMeter"
          columns={[
            { key: "scenario", label: "Scénario" },
            { key: "mix", label: "Mix" },
            { key: "threads", label: "Threads (paliers)" },
            { key: "rampup", label: "Ramp-up" },
            { key: "duree", label: "Durée/palier" },
            { key: "payload", label: "Payload" }
          ]}
          data={t1ScenarioRows}
        />
        <TableCard
          title="T2 — Résultats JMeter (par scénario et variante)"
          columns={[
            { key: "scenario", label: "Scénario" },
            { key: "mesure", label: "Mesure" },
            { key: "variantA", label: "A : Jersey" },
            { key: "variantC", label: "C : @RestController" },
            { key: "variantD", label: "D : Spring Data REST" }
          ]}
          data={t2ResultRows}
        />
        <TableCard
          title="T3 — Ressources JVM (Prometheus)"
          columns={[
            { key: "variant", label: "Variante" },
            { key: "cpu", label: "CPU proc. (%) moy/pic" },
            { key: "heap", label: "Heap (Mo) moy/pic" },
            { key: "gc", label: "GC time (ms/s) moy/pic" },
            { key: "threads", label: "Threads actifs moy/pic" },
            { key: "hikari", label: "Hikari (actifs/max)" }
          ]}
          data={t3ResourceRows}
        />
        <TableCard
          title="T4 — Détails par endpoint (scénario JOIN-filter)"
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "variantA", label: "A" },
            { key: "variantC", label: "C" },
            { key: "variantD", label: "D" },
            { key: "rps", label: "RPS (ms)" },
            { key: "p95", label: "p95 (ms)" },
            { key: "err", label: "Err %" },
            { key: "observations", label: "Observations" }
          ]}
          data={t4JoinRows}
        />
        <TableCard
          title="T5 — Détails par endpoint (scénario MIXED)"
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "variantA", label: "A" },
            { key: "variantC", label: "C" },
            { key: "variantD", label: "D" },
            { key: "rps", label: "RPS" },
            { key: "p95", label: "p95 (ms)" },
            { key: "err", label: "Err %" },
            { key: "observations", label: "Observations" }
          ]}
          data={t5MixedRows}
        />
        <TableCard
          title="T6 — Incidents / erreurs"
          columns={[
            { key: "run", label: "Run" },
            { key: "variant", label: "Variante" },
            { key: "type", label: "Type d'erreur (HTTP/DB/timeout)" },
            { key: "cause", label: "Cause probable" },
            { key: "action", label: "Action corrective" }
          ]}
          data={t6IncidentRows}
        />
        <TableCard
          title="T7 — Synthèse & conclusion"
          columns={[
            { key: "criteres", label: "Critère" },
            { key: "best", label: "Meilleure variante" },
            { key: "gap", label: "Écart (justifier)" },
            { key: "comments", label: "Commentaires" }
          ]}
          data={t7SummaryRows}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-primary-700">
          Analyses en temps réel (API)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Mesures calculées automatiquement à partir des web services REST pour
          suivre l&apos;état courant du catalogue.
        </p>

        <div className="mt-6 space-y-8">
          <TableCard
            title="Instantané des données backend"
            columns={[
              { key: "element", label: "Élément" },
              { key: "valeur", label: "Valeur" }
            ]}
            data={apiSnapshotRows}
          />

          <TableCard
            title="Répartition des catégories (GET /api/categories)"
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Nom" },
              { key: "itemsCount", label: "Nb d'articles", align: "right" },
              { key: "stock", label: "Stock cumulé", align: "right" },
              { key: "updatedAt", label: "Mise à jour" }
            ]}
            data={categories.map((category) => ({
              code: category.code,
              name: category.name,
              itemsCount: numberFormatter.format(
                itemsByCategory[category.id] ?? 0
              ),
              stock: numberFormatter.format(stockByCategory[category.id] ?? 0),
              updatedAt: dateTimeFormatter.format(new Date(category.updatedAt))
            }))}
          />
          <TableCard
            title="Inventaire des articles (GET /api/items)"
            description="Articles actuellement chargés avec leur catégorie et leur stock."
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Nom" },
              { key: "categoryCode", label: "Catégorie" },
              { key: "price", label: "Prix" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={items.map((item) => ({
              sku: item.sku,
              name: item.name,
            categoryCode: item.categoryCode ?? "—",
            price: currencyFormatter.format(Number(item.price ?? 0)),
            stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Items par catégorie (GET /api/categories/{id}/items)"
            description={
              categories.length > 0
                ? `Catégorie analysée : ${categories[0].name} (${categories[0].code})`
                : "Aucune catégorie disponible."
            }
            columns={[
              { key: "index", label: "#" },
              { key: "sku", label: "SKU" },
              { key: "name", label: "Nom" },
              { key: "price", label: "Prix" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={relationItems.map((item, index) => ({
              index: index + 1,
              sku: item.sku,
              name: item.name,
              price: currencyFormatter.format(Number(item.price ?? 0)),
              stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Top 5 des stocks (analyse GET /api/items)"
            columns={[
              { key: "rank", label: "#" },
              { key: "name", label: "Nom" },
              { key: "sku", label: "SKU" },
              { key: "categoryCode", label: "Catégorie" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={topStockItems.map((item, index) => ({
              rank: index + 1,
              name: item.name,
              sku: item.sku,
            categoryCode: item.categoryCode ?? "—",
              stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Synthèse API par catégorie"
            columns={[
              { key: "category", label: "Catégorie" },
              { key: "itemsCount", label: "Articles", align: "right" },
              { key: "avgPrice", label: "Prix moyen" },
              { key: "totalStock", label: "Stock total", align: "right" }
            ]}
            data={categories.map((category) => {
              const categoryItems = items.filter(
                (item) => item.categoryId === category.id
              );
              const categoryAvgPrice =
                categoryItems.length > 0
                  ? categoryItems.reduce(
                      (sum, item) => sum + Number(item.price ?? 0),
                      0
                    ) / categoryItems.length
                  : 0;
              return {
                category: `${category.name} (${category.code})`,
                itemsCount: numberFormatter.format(categoryItems.length),
                avgPrice: currencyFormatter.format(categoryAvgPrice),
                totalStock: numberFormatter.format(
                  stockByCategory[category.id] ?? 0
                )
              };
            })}
          />
          <TableCard
            title="Log des appels API (résumé)"
            description="Basé sur les réponses des 3 web services consommés côté frontend."
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "status", label: "Statut" },
            { key: "elements", label: "Éléments", align: "right" },
            { key: "comment", label: "Commentaire" }
          ]}
          data={[
            {
              endpoint: "GET /api/categories",
              status: categoriesPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(totalCategories),
              comment: categoriesPage
                ? "Catalogue de catégories chargé."
                : "Échec de la récupération."
            },
            {
              endpoint: "GET /api/items",
              status: itemsPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(totalItems),
              comment: itemsPage
                ? "Inventaire des articles disponible."
                : "Impossible de charger les items."
            },
            {
              endpoint: "GET /api/categories/{id}/items",
              status: relationPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(relationItems.length),
              comment:
                relationPage && categories.length > 0
                  ? `Relation chargée pour ${categories[0].code}.`
                  : "Sélection d'une catégorie requise."
            }
          ]}
        />
        </div>
      </section>

      <footer className="mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-primary-700">
          Indications rapides (implémentation)
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-slate-800">JPA mappings</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  Item @ManyToOne(fetch = LAZY) Category category
                </code>
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  Category @OneToMany(mappedBy=&quot;category&quot;) List&lt;Item&gt;
                </code>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Requêtes côté contrôleur / repository
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Liste items : Page&lt;Item&gt; findAll(Pageable p)</li>
              <li>Filtre : Page&lt;Item&gt; findByCategoryId(Long categoryId, Pageable p)</li>
              <li>
                Variante anti-N+1 : @Query SELECT i FROM Item i JOIN FETCH i.category
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Spring Data REST</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Repos ItemRepository, CategoryRepository exposés</li>
              <li>Projections pour limiter HAL lorsque besoin comparer payloads</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Livrables</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Code des variantes A/C/D (endpoints identiques)</li>
              <li>Fichiers JMeter (.jmx) pour les 4 scénarios</li>
              <li>Dashboards Grafana (JVM + métriques csv exportés)</li>
              <li>
                Tableaux T0 ➜ T7 remplis + analyse (impact JOIN, pagination relationnelle, HAL,
                etc.)
              </li>
              <li>
                Recommandations d&apos;usage (lecture relationnelle, forte écriture, exposition
                rapide de CRUD)
              </li>
            </ol>
          </div>
        </div>
      </footer>
    </main>
  );
}

