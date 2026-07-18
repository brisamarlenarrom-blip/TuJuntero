/* =====================================================
   SERVICIO GENERAL DE FIRESTORE
   ===================================================== */

import { Injectable } from '@angular/core';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  // Tipos
  DocumentData,
  DocumentReference,
  QueryConstraint,
  UpdateData,
  // Operaciones de arrays
  arrayUnion,
  arrayRemove

} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

/*
 * Esta interfaz representa cualquier documento recuperado
 * desde Firestore que incluya un identificador.
 *
 * El tipo genérico T representa los campos particulares
 * de cada colección.
 */
export type DocumentoConId<T> = T & {
  id: string;
};

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(
    private firestore: Firestore
  ) {}

  /* =====================================================
     OBTENER TODOS LOS DOCUMENTOS
     ===================================================== */

  /*
   * Recupera todos los documentos de una colección.
   *
   * Ejemplo:
   *
   * this.firestoreService.getCollection<Usuario>('usuarios');
   *
   * El campo id se agrega automáticamente al resultado.
   */
  getCollection<T extends object>(
    nombreColeccion: string
  ): Observable<DocumentoConId<T>[]> {
    const referenciaColeccion = collection(
      this.firestore,
      nombreColeccion
    );

    return collectionData(
      referenciaColeccion,
      {
        idField: 'id'
      }
    ) as Observable<DocumentoConId<T>[]>;
  }

  /* =====================================================
     OBTENER DOCUMENTOS FILTRADOS
     ===================================================== */

  /*
   * Recupera los documentos cuyo campo coincida
   * exactamente con el valor recibido.
   *
   * Ejemplo:
   *
   * getByField<Usuario>(
   *   'usuarios',
   *   'email',
   *   'correo@email.com'
   * );
   */
  getByField<T extends object>(
    nombreColeccion: string,
    campo: string,
    valor: unknown
  ): Observable<DocumentoConId<T>[]> {
    const referenciaColeccion = collection(
      this.firestore,
      nombreColeccion
    );

    const consulta = query(
      referenciaColeccion,
      where(
        campo,
        '==',
        valor
      )
    );

    return collectionData(
      consulta,
      {
        idField: 'id'
      }
    ) as Observable<DocumentoConId<T>[]>;
  }

  /* =====================================================
     OBTENER DOCUMENTOS CON VARIOS FILTROS
     ===================================================== */

  /*
   * Este método permite realizar consultas más complejas
   * utilizando restricciones de Firestore.
   *
   * Puede recibir:
   * - where();
   * - orderBy();
   * - limit();
   * - startAfter();
   *
   * Ejemplo:
   *
   * getCollectionWithQuery<Receta>(
   *   'recetas',
   *   where('categoria', '==', 'desayuno')
   * );
   */
  getCollectionWithQuery<T extends object>(
    nombreColeccion: string,
    ...restricciones: QueryConstraint[]
  ): Observable<DocumentoConId<T>[]> {
    const referenciaColeccion = collection(
      this.firestore,
      nombreColeccion
    );

    const consulta = query(
      referenciaColeccion,
      ...restricciones
    );

    return collectionData(
      consulta,
      {
        idField: 'id'
      }
    ) as Observable<DocumentoConId<T>[]>;
  }

  /* =====================================================
     OBTENER UN DOCUMENTO POR ID
     ===================================================== */

  /*
   * Recupera un único documento mediante su ID.
   *
   * Si el documento no existe, el Observable puede
   * devolver undefined.
   */
  getById<T extends object>(
    nombreColeccion: string,
    id: string
  ): Observable<DocumentoConId<T> | undefined> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return docData(
      referenciaDocumento,
      {
        idField: 'id'
      }
    ) as Observable<DocumentoConId<T> | undefined>;
  }

  /* =====================================================
     CREAR DOCUMENTO CON ID AUTOMÁTICO
     ===================================================== */

  /*
   * Firestore genera automáticamente el identificador.
   *
   * Este método devuelve una referencia al documento creado.
   * Desde esa referencia se puede obtener el ID mediante:
   *
   * referencia.id
   */
  create<T extends object>(
    nombreColeccion: string,
    datos: T
  ): Promise<DocumentReference<DocumentData>> {
    const referenciaColeccion = collection(
      this.firestore,
      nombreColeccion
    );

    return addDoc(
      referenciaColeccion,
      datos
    );
  }

  /* =====================================================
     CREAR DOCUMENTO CON ID ESPECÍFICO
     ===================================================== */

  /*
   * Permite decidir manualmente cuál será el identificador.
   *
   * En los usuarios se utiliza el UID generado por
   * Firebase Authentication.
   */
  createWithId<T extends object>(
    nombreColeccion: string,
    id: string,
    datos: T
  ): Promise<void> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return setDoc(
      referenciaDocumento,
      datos
    );
  }

  /* =====================================================
     CREAR O ACTUALIZAR PARCIALMENTE
     ===================================================== */

  /*
   * Guarda un documento utilizando un ID específico.
   *
   * La opción merge evita reemplazar completamente
   * el documento si ya existe. Solamente modifica
   * los campos enviados.
   */
  setWithMerge<T extends object>(
    nombreColeccion: string,
    id: string,
    datos: Partial<T>
  ): Promise<void> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return setDoc(
      referenciaDocumento,
      datos,
      {
        merge: true
      }
    );
  }

  /* =====================================================
     ACTUALIZAR DOCUMENTO
     ===================================================== */

 /*
 * @param nombreColeccion Colección donde se encuentra el documento.
 * @param documentoId Identificador del documento.
 * @param datos Campos que se desean actualizar.
 */
async update<T extends object>(
  nombreColeccion: string,
  documentoId: string,
  datos: Partial<T>
): Promise<void> {

  const referenciaDocumento = doc(
    this.firestore,
    nombreColeccion,
    documentoId
  );

  await updateDoc(
    referenciaDocumento,
    datos as UpdateData<DocumentData>
  );
}

  /* =====================================================
     ELIMINAR DOCUMENTO
     ===================================================== */

  /*
   * Elimina completamente un documento de Firestore.
   */
  delete(
    nombreColeccion: string,
    id: string
  ): Promise<void> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return deleteDoc(referenciaDocumento);
  }

  /* =====================================================
     AGREGAR ELEMENTO A UN ARRAY
     ===================================================== */

  /*
   * arrayUnion agrega un valor solamente si todavía
   * no existe dentro del array.
   *
   * Esto es útil para favoritos, categorías, etiquetas
   * o listas de identificadores.
   */
  addToArray(
    nombreColeccion: string,
    id: string,
    campo: string,
    valor: unknown
  ): Promise<void> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return updateDoc(
      referenciaDocumento,
      {
        [campo]: arrayUnion(valor)
      }
    );
  }

  /* =====================================================
     QUITAR ELEMENTO DE UN ARRAY
     ===================================================== */

  /*
   * arrayRemove elimina todas las coincidencias del valor
   * indicado dentro del array.
   */
  removeFromArray(
    nombreColeccion: string,
    id: string,
    campo: string,
    valor: unknown
  ): Promise<void> {
    const referenciaDocumento = doc(
      this.firestore,
      nombreColeccion,
      id
    );

    return updateDoc(
      referenciaDocumento,
      {
        [campo]: arrayRemove(valor)
      }
    );
  }
}