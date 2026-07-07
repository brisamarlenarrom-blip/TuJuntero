/// Servicio general para trabajar con Firebase Firestore
import { Injectable } from '@angular/core';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  // Obtiene todos los documentos de una colección
  getCollection(coleccion: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    return collectionData(col, { idField: 'id' }) as Observable<any[]>;
  }

  // Obtiene documentos filtrando por un campo
  getByField(coleccion: string, campo: string, valor: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    const q = query(col, where(campo, '==', valor));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  // Obtiene un documento por ID
  getById(coleccion: string, id: string): Observable<any> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return docData(docRef, { idField: 'id' });
  }

  // Crea un documento con ID automático
  create(coleccion: string, data: any): Promise<any> {
    const col = collection(this.firestore, coleccion);
    return addDoc(col, data);
  }

  // Actualiza un documento existente
  update(coleccion: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return updateDoc(docRef, data);
  }

  // Elimina un documento
  delete(coleccion: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return deleteDoc(docRef);
  }

  // Crea un documento con un ID específico
  createWithId(coleccion: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return setDoc(docRef, data);
  }

  // Agrega un valor a un array dentro de un documento
  addToArray(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return updateDoc(docRef, {
      [campo]: arrayUnion(valor)
    });
  }

  // Quita un valor de un array dentro de un documento
  removeFromArray(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return updateDoc(docRef, {
      [campo]: arrayRemove(valor)
    });
  }
}