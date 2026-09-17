# v2 Plan — diagrams

Visual companion to [`ROADMAP.md`](./ROADMAP.md). `cl#` =
`create-lumen`, `lc#` = `lumen-cli`. All diagrams render on GitHub.

## 1. Functional milestones

Each milestone closes with an observable result; no waiting for the
90%-assembled scaffold.

```mermaid
flowchart LR
    M1["🧱 M1 · v2.0.0-alpha<br/>Core: React/Vite + manifest v2"]
    M2["⚙️ M2 · v2.0.0-alpha.2<br/>Engine: capabilities + options"]
    M3["▲ M3 · v2.0.0-beta<br/>Next.js support"]
    M4["🧪 M4 · v2.0.0-rc<br/>Testing &amp; quality"]
    M5["📦 M5 · v2.0.0<br/>Docs &amp; release"]

    M1 -->|"npm create lumen@alpha my-app works"| M2
    M2 -->|"composed templates + shadcn/none/hybrid"| M3
    M3 -->|"Next.js scaffolds and runs"| M4
    M4 -->|"scalable tests + headless e2e"| M5
    M5 -->|"v2.0.0 stable"| DONE(((✅)))
```

## 2. Dependency graph (cross-project)

Solid arrows = hard dependency. Dotted arrows = cross-repo dependency
(`create-lumen` → `lumen-cli`).

```mermaid
flowchart TD
    subgraph CL["create-lumen v2"]
        direction TB
        cl13["#13 nested schema"]
        cl14["#14 Zod validator"]
        cl15["#15 path mapping"]
        cl16["#16 emit lumen.config.json"]
        cl4["#4 publish JSON Schema"]
        cl9["#9 shared contract"]
        cl6["#6 Tailwind v4"]
        cl24["#24 tooling parity"]
        cl23["#23 validate React/Vite under v2"]
        cl29["#29 non-interactive flags"]
        cl31["#31 CI pre-releases"]
        cl25["#25 capability model"]
        cl26["#26 gate prompts"]
        cl27["#27 template composition"]
        cl33["#33 shadcn/ui"]
        cl34["#34 architecture none/hybrid"]
        cl8["#8 Next.js epic"]
        clNext["#18–#22 Next.js tasks"]
        cl35["#35 testing epic"]
        cl36["#36 pairwise/t-way"]
        cl37["#37 per-overlay contract tests"]
        cl28["#28 schema fixtures"]
        cl5["#5 headless e2e"]
        cl17["#17 migration guide"]

        cl13 --> cl14 --> cl16
        cl13 --> cl15 --> cl16
        cl13 --> cl4
        cl13 --> cl9
        cl13 --> cl25 --> cl26 --> cl27
        cl6 --> cl23
        cl24 --> cl23
        cl16 --> cl23 --> cl31
        cl16 --> cl29 --> cl5
        cl16 --> cl17
        cl14 --> cl28
        cl27 --> cl33
        cl27 --> cl34
        cl27 --> cl8 --> clNext
        cl35 --> cl36
        cl35 --> cl37
    end

    subgraph LC["lumen-cli v1"]
        direction TB
        lc1["#1 bootstrap"]
        lc2["#2 command framework"]
        lc3["#3 config reader"]
        lc4["#4 lumen config"]
        lc5["#5 create/init"]
        lc6["#6 forward tooling flags"]
        lc7["#7 generator core"]
        lcGen["#8 #11–#14 generators"]
        lc9["#9 ui registry"]
        lc10["#10 themes"]
        lc24["#24 port documentador"]
        lc16["#16 python bridge"]
        lcDocs["#15 #17–#19 #25 docs"]
        lc20["#20 doctor"]
        lc21["#21 sync-barrels"]

        lc1 --> lc2
        lc2 --> lc3 --> lc7
        lc3 --> lc4
        lc3 --> lc20
        lc7 --> lcGen
        lc7 --> lc9 --> lc10
        lc7 --> lc21
        lc24 --> lc16 --> lcDocs
        lc2 --> lc5 --> lc6
    end

    cl9 -.-> lc3
    cl13 -.-> lc3
    cl33 -.-> lc9
    cl16 -.-> lc5
```

## 3. Parallel work — waves (4 devs)

Everything in a wave can run at the same time.

```mermaid
flowchart TB
    subgraph W0["🌊 Wave 0 — start now (fully parallel)"]
        direction LR
        A["Lane A<br/>create-lumen manifest core<br/>cl#13 #14 #15 #16 #4"]
        B["Lane B<br/>templates / tooling<br/>cl#6 #24"]
        C["Lane C<br/>lumen-cli skeleton<br/>lc#1 #2"]
        D["Lane D<br/>docs-engine port<br/>lc#24 #16"]
        G["Lane G<br/>testing strategy<br/>cl#35 #36 #37 #28 #5"]
    end

    subgraph W1["🌊 Wave 1"]
        direction LR
        E["Lane E<br/>engine + options<br/>cl#25 #26 #27 #33 #34 #11"]
        H["Lane H<br/>lumen-cli generators<br/>lc#7 #8 #11–#14"]
    end

    subgraph W2["🌊 Wave 2"]
        direction LR
        F["Lane F<br/>Next.js<br/>cl#8 #18–#22"]
        I["Lane I<br/>UI registry<br/>lc#9 #10"]
        J["Lane J<br/>docs engine features<br/>lc#15 #17–#19 #25"]
        K["Lane K<br/>doctor / barrels<br/>lc#20 #21"]
    end

    subgraph W3["🌊 Wave 3 — release"]
        L["Lane L<br/>release &amp; docs<br/>cl#17 #30 · lc#22"]
    end

    A --> E --> F
    C --> H
    H --> I
    H --> K
    D --> J
    G -.-> L
    F --> L
    I --> L
    J --> L
    K --> L
```

Suggested split: **Dev 1** A→E→F · **Dev 2** B→G→L · **Dev 3**
C→H→I→K · **Dev 4** D→J.

## 4. v2 generation pipeline

How a scaffold is produced once the engine (M2) lands.

```mermaid
flowchart LR
    P["prompts"] --> CAP["capabilities"]
    CAP --> COMP["template composition<br/>(fragments)"]
    COMP --> INJ["injector"]
    INJ --> CSS["CSS overlay<br/>Tailwind / Bootstrap / none"]
    CSS --> CFG["tsconfig / vite + @/ alias"]
    CFG --> FMT["format pass"]
    FMT --> OUT[("generated project")]
    SCHEMA[["JSON Schema<br/>#4"]] -. "validates" .-> MAN[["lumen.config.json<br/>#16"]]
    OUT --> MAN
    MAN -. "read by" .-> CLI["lumen-cli<br/>lc#3 config reader"]
```

## 5. Release train

```mermaid
graph LR
    A["v2.0.0-alpha<br/>M1"] --> B["v2.0.0-alpha.2<br/>M2"]
    B --> C["v2.0.0-beta<br/>M3"]
    C --> D["v2.0.0-rc<br/>M4"]
    D --> E["v2.0.0<br/>M5"]
    E -.-> F["lumen-cli<br/>v1.0.0"]
```
