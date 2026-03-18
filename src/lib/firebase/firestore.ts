import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  type QueryConstraint,
  type DocumentData,
  type CollectionReference,
} from "firebase/firestore";
import { db } from "./config";
import type {
  WorkspaceBrandId,
  PageBrandId,
  DatabaseBrandId,
  RowBrandId,
  ViewBrandId,
  ShareToken,
  UserBrandId,
} from "@/types";

export function workspaceRef(workspaceId: WorkspaceBrandId) {
  return doc(db, "workspaces", workspaceId);
}

export function pagesCollection() {
  return collection(db, "pages") as CollectionReference<DocumentData>;
}

export function pageRef(pageId: PageBrandId) {
  return doc(db, "pages", pageId);
}

export function databasesCollection() {
  return collection(db, "databases") as CollectionReference<DocumentData>;
}

export function databaseRef(databaseId: DatabaseBrandId) {
  return doc(db, "databases", databaseId);
}

export function dbRowsCollection() {
  return collection(db, "dbRows") as CollectionReference<DocumentData>;
}

export function dbRowRef(rowId: RowBrandId) {
  return doc(db, "dbRows", rowId);
}

export function dbViewsCollection() {
  return collection(db, "dbViews") as CollectionReference<DocumentData>;
}

export function dbViewRef(viewId: ViewBrandId) {
  return doc(db, "dbViews", viewId);
}

export function publishedPageRef(shareToken: ShareToken) {
  return doc(db, "publishedPages", shareToken);
}

export function userProfileRef(uid: UserBrandId) {
  return doc(db, "userProfiles", uid);
}

export function userProfilesCollection() {
  return collection(db, "userProfiles") as CollectionReference<DocumentData>;
}

export {
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  doc,
  collection,
};
export type { QueryConstraint };
