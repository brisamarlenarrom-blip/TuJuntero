// Servicio de Firebase Firestore
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  getCollection(coleccion: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    return collectionData(col, { idField: 'id' }) as Observable<any[]>;
  }

  getByField(coleccion: string, campo: string, valor: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    const q = query(col, where(campo, '==', valor));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  getById(coleccion: string, id: string): Observable<any> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return docData(docRef, { idField: 'id' });
  }

  create(coleccion: string, data: any): Promise<any> {
    const col = collection(this.firestore, coleccion);
    return addDoc(col, data);
  }

  update(coleccion: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return updateDoc(docRef, data);
  }

  delete(coleccion: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return deleteDoc(docRef);
  }

  createWithId(coleccion: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return setDoc(docRef, data);
  }
}