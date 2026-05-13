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
  ShareToken,
  WorkspaceBrandId,
  PageBrandId,
  DatabaseBrandId,
  RowBrandId,
  ViewBrandId,
  UserBrandId,
} from "@/types";

export function workspaceRef(workspaceId: WorkspaceBrandId | undefined) {
  if (!workspaceId) throw new Error("workspaceRef: workspaceId is required");
  return doc(db, "workspaces", workspaceId);
}

export function pagesCollection() {
  return collection(db, "pages") as CollectionReference<DocumentData>;
}

export function pageRef(pageId: PageBrandId | undefined) {
  if (!pageId) throw new Error("pageRef: pageId is required");
  return doc(db, "pages", pageId);
}

export function databasesCollection() {
  return collection(db, "databases") as CollectionReference<DocumentData>;
}

export function databaseRef(databaseId: DatabaseBrandId | undefined) {
  if (!databaseId) throw new Error("databaseRef: databaseId is required");
  return doc(db, "databases", databaseId);
}

export function dbRowsCollection() {
  return collection(db, "dbRows") as CollectionReference<DocumentData>;
}

export function dbRowRef(rowId: RowBrandId | undefined) {
  if (!rowId) throw new Error("dbRowRef: rowId is required");
  return doc(db, "dbRows", rowId);
}

export function dbViewsCollection() {
  return collection(db, "dbViews") as CollectionReference<DocumentData>;
}

export function dbViewRef(viewId: ViewBrandId | undefined) {
  if (!viewId) throw new Error("dbViewRef: viewId is required");
  return doc(db, "dbViews", viewId);
}

export function publishedPageRef(shareToken: ShareToken) {
  return doc(db, "publishedPages", shareToken);
}

export function userProfileRef(uid: UserBrandId | undefined) {
  if (!uid) throw new Error("userProfileRef: uid is required");
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
