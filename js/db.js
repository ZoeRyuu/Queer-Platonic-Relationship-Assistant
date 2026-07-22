const DB_NAME = "qpr-assistant";
const DB_VERSION = 3;
const STORES = ["answers", "meta", "snapshots", "relationships", "spectrumSnapshots"];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("answers")) {
        db.createObjectStore("answers", { keyPath: "questionId" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("snapshots")) {
        db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("relationships")) {
        db.createObjectStore("relationships", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("spectrumSnapshots")) {
        db.createObjectStore("spectrumSnapshots", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function makeItemId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function tx(storeName, mode) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        resolve({ t, store });
      })
  );
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- answers ----------
export async function setAnswer(questionId, value) {
  const { store } = await tx("answers", "readwrite");
  return reqToPromise(
    store.put({ questionId, value, updatedAt: Date.now() })
  );
}

export async function getAnswer(questionId) {
  const { store } = await tx("answers", "readonly");
  const rec = await reqToPromise(store.get(questionId));
  return rec ? rec.value : undefined;
}

export async function getAllAnswers() {
  const { store } = await tx("answers", "readonly");
  const all = await reqToPromise(store.getAll());
  const map = {};
  for (const rec of all) map[rec.questionId] = rec.value;
  return map;
}

export async function deleteAnswer(questionId) {
  const { store } = await tx("answers", "readwrite");
  return reqToPromise(store.delete(questionId));
}

// ---------- meta (key/value: settings, pin, progress markers) ----------
export async function getMeta(key, fallback = undefined) {
  const { store } = await tx("meta", "readonly");
  const rec = await reqToPromise(store.get(key));
  return rec ? rec.value : fallback;
}

export async function setMeta(key, value) {
  const { store } = await tx("meta", "readwrite");
  return reqToPromise(store.put({ key, value }));
}

export async function deleteMeta(key) {
  const { store } = await tx("meta", "readwrite");
  return reqToPromise(store.delete(key));
}

// ---------- snapshots ----------
export async function createSnapshot(name) {
  const answers = await getAllAnswers();
  const { store } = await tx("snapshots", "readwrite");
  const record = { name, createdAt: Date.now(), answers };
  const id = await reqToPromise(store.add(record));
  return { id, ...record };
}

export async function listSnapshots() {
  const { store } = await tx("snapshots", "readonly");
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSnapshot(id) {
  const { store } = await tx("snapshots", "readonly");
  return reqToPromise(store.get(id));
}

export async function deleteSnapshot(id) {
  const { store } = await tx("snapshots", "readwrite");
  return reqToPromise(store.delete(id));
}

// ---------- relationships ----------
function newRelationshipRecord({ name, tags = [], startDate = null, status = "" }) {
  const now = Date.now();
  return {
    name,
    tags,
    startDate,
    status,
    archived: false,
    createdAt: now,
    updatedAt: now,
    boundaries: [],
    commitments: [],
    anniversaries: [],
    agreements: [],
    reviewCycleDays: null,
    lastReviewAt: null,
    nextReviewAt: null,
    reviews: [],
  };
}

export async function createRelationship(fields) {
  const { store } = await tx("relationships", "readwrite");
  const record = newRelationshipRecord(fields);
  const id = await reqToPromise(store.add(record));
  return { id, ...record };
}

export async function getRelationship(id) {
  const { store } = await tx("relationships", "readonly");
  return reqToPromise(store.get(id));
}

export async function listRelationships() {
  const { store } = await tx("relationships", "readonly");
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteRelationship(id) {
  const { store } = await tx("relationships", "readwrite");
  return reqToPromise(store.delete(id));
}

async function putRelationship(rec) {
  const { store } = await tx("relationships", "readwrite");
  return reqToPromise(store.put(rec));
}

async function mutateRelationship(id, mutator) {
  const rec = await getRelationship(id);
  if (!rec) throw new Error("关系档案不存在");
  mutator(rec);
  rec.updatedAt = Date.now();
  await putRelationship(rec);
  return rec;
}

export async function updateRelationshipBasic(id, { name, tags, startDate, status }) {
  return mutateRelationship(id, (rec) => {
    if (name !== undefined) rec.name = name;
    if (tags !== undefined) rec.tags = tags;
    if (startDate !== undefined) rec.startDate = startDate;
    if (status !== undefined) rec.status = status;
  });
}

export async function setRelationshipArchived(id, archived) {
  return mutateRelationship(id, (rec) => {
    rec.archived = archived;
  });
}

// boundaries & commitments share the same versioned-list shape
function addListItem(rec, listKey, fields) {
  const now = Date.now();
  rec[listKey].push({ id: makeItemId(), ...fields, updatedAt: now, history: [] });
}

function updateListItem(rec, listKey, itemId, newFields) {
  const item = rec[listKey].find((i) => i.id === itemId);
  if (!item) return;
  const { history, updatedAt, id, ...prevFields } = item;
  item.history.push({ ...prevFields, updatedAt });
  Object.assign(item, newFields);
  item.updatedAt = Date.now();
}

function removeListItem(rec, listKey, itemId) {
  rec[listKey] = rec[listKey].filter((i) => i.id !== itemId);
}

export async function addBoundary(relId, text) {
  return mutateRelationship(relId, (rec) => addListItem(rec, "boundaries", { text }));
}
export async function updateBoundary(relId, itemId, text) {
  return mutateRelationship(relId, (rec) => updateListItem(rec, "boundaries", itemId, { text }));
}
export async function removeBoundary(relId, itemId) {
  return mutateRelationship(relId, (rec) => removeListItem(rec, "boundaries", itemId));
}

export async function addCommitment(relId, text) {
  return mutateRelationship(relId, (rec) => addListItem(rec, "commitments", { text }));
}
export async function updateCommitment(relId, itemId, text) {
  return mutateRelationship(relId, (rec) => updateListItem(rec, "commitments", itemId, { text }));
}
export async function removeCommitment(relId, itemId) {
  return mutateRelationship(relId, (rec) => removeListItem(rec, "commitments", itemId));
}

export async function addAnniversary(relId, { label, date }) {
  return mutateRelationship(relId, (rec) => {
    rec.anniversaries.push({ id: makeItemId(), label, date });
  });
}
export async function removeAnniversary(relId, itemId) {
  return mutateRelationship(relId, (rec) => {
    rec.anniversaries = rec.anniversaries.filter((i) => i.id !== itemId);
  });
}

export async function addAgreement(relId, { title, note }) {
  return mutateRelationship(relId, (rec) => {
    rec.agreements.push({ id: makeItemId(), title, note, updatedAt: Date.now() });
  });
}
export async function updateAgreement(relId, itemId, { title, note }) {
  return mutateRelationship(relId, (rec) => {
    const item = rec.agreements.find((i) => i.id === itemId);
    if (!item) return;
    if (title !== undefined) item.title = title;
    if (note !== undefined) item.note = note;
    item.updatedAt = Date.now();
  });
}
export async function removeAgreement(relId, itemId) {
  return mutateRelationship(relId, (rec) => {
    rec.agreements = rec.agreements.filter((i) => i.id !== itemId);
  });
}

// ---------- review cycle ----------
export async function setReviewCycle(relId, days) {
  return mutateRelationship(relId, (rec) => {
    rec.reviewCycleDays = days;
    if (!days) {
      rec.nextReviewAt = null;
    } else {
      const base = rec.lastReviewAt || Date.now();
      rec.nextReviewAt = base + days * 86400000;
    }
  });
}

export async function recordReview(relId, { workingWell, needsAdjustment, notes }) {
  return mutateRelationship(relId, (rec) => {
    const now = Date.now();
    rec.reviews.push({ id: makeItemId(), date: now, workingWell, needsAdjustment, notes });
    rec.lastReviewAt = now;
    rec.nextReviewAt = rec.reviewCycleDays ? now + rec.reviewCycleDays * 86400000 : null;
  });
}

export async function listDueRelationships() {
  const all = await listRelationships();
  const now = Date.now();
  return all.filter((r) => !r.archived && r.nextReviewAt && r.nextReviewAt <= now);
}

// ---------- spectrum ----------
const SPECTRUM_CURRENT_KEY = "spectrumCurrent";

export async function getSpectrumCurrent() {
  const value = await getMeta(SPECTRUM_CURRENT_KEY);
  return value || { axes: {} };
}

export async function setSpectrumAxisValue(axisId, value) {
  const current = await getSpectrumCurrent();
  const axes = { ...current.axes, [axisId]: value };
  await setMeta(SPECTRUM_CURRENT_KEY, { axes });
  return { axes };
}

export async function createSpectrumSnapshot(note) {
  const current = await getSpectrumCurrent();
  const { store } = await tx("spectrumSnapshots", "readwrite");
  const record = { note: note || "", createdAt: Date.now(), axes: current.axes };
  const id = await reqToPromise(store.add(record));
  return { id, ...record };
}

export async function listSpectrumSnapshots() {
  const { store } = await tx("spectrumSnapshots", "readonly");
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSpectrumSnapshot(id) {
  const { store } = await tx("spectrumSnapshots", "readonly");
  return reqToPromise(store.get(id));
}

export async function deleteSpectrumSnapshot(id) {
  const { store } = await tx("spectrumSnapshots", "readwrite");
  return reqToPromise(store.delete(id));
}

// ---------- export / import / clear ----------
export async function exportAll() {
  const [answersMap, snapshots, relationships, spectrumSnapshots] = await Promise.all([
    getAllAnswers(),
    listSnapshots(),
    listRelationships(),
    listSpectrumSnapshots(),
  ]);
  const { store } = await tx("meta", "readonly");
  const metaAll = await reqToPromise(store.getAll());
  const meta = {};
  for (const rec of metaAll) {
    if (rec.key === "pin") continue; // never export PIN
    meta[rec.key] = rec.value;
  }
  return {
    app: "qpr-assistant",
    exportVersion: 3,
    exportedAt: new Date().toISOString(),
    answers: answersMap,
    meta,
    snapshots,
    relationships,
    spectrumSnapshots,
  };
}

export async function importAll(data) {
  if (!data || data.app !== "qpr-assistant") {
    throw new Error("文件格式不正确,无法识别为 QPR 助手的备份文件");
  }
  await clearAll({ keepPin: true });
  const db = await openDB();

  await new Promise((resolve, reject) => {
    const t = db.transaction(["answers", "meta", "snapshots", "relationships", "spectrumSnapshots"], "readwrite");
    const answersStore = t.objectStore("answers");
    const metaStore = t.objectStore("meta");
    const snapshotsStore = t.objectStore("snapshots");
    const relationshipsStore = t.objectStore("relationships");
    const spectrumSnapshotsStore = t.objectStore("spectrumSnapshots");

    for (const [questionId, value] of Object.entries(data.answers || {})) {
      answersStore.put({ questionId, value, updatedAt: Date.now() });
    }
    for (const [key, value] of Object.entries(data.meta || {})) {
      metaStore.put({ key, value });
    }
    for (const snap of data.snapshots || []) {
      const { id, ...rest } = snap;
      snapshotsStore.add(rest);
    }
    for (const rel of data.relationships || []) {
      const { id, ...rest } = rel;
      relationshipsStore.add(rest);
    }
    for (const snap of data.spectrumSnapshots || []) {
      const { id, ...rest } = snap;
      spectrumSnapshotsStore.add(rest);
    }
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function clearAll({ keepPin = false } = {}) {
  const db = await openDB();
  let pinValue;
  if (keepPin) {
    pinValue = await getMeta("pin");
  }
  await new Promise((resolve, reject) => {
    const t = db.transaction(STORES, "readwrite");
    for (const name of STORES) t.objectStore(name).clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  if (keepPin && pinValue !== undefined) {
    await setMeta("pin", pinValue);
  }
}
