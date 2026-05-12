import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  limit,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { InterviewRoomData, Message, InterviewFeedback, UserProfile } from '../types';
import { aiService } from './aiService';

export const interviewService = {
  // Matching logic
  async joinQueue(user: UserProfile, topic: string) {
    const queueRef = collection(db, 'matchingQueue');
    const q = query(
      queueRef, 
      where('status', '==', 'searching'),
      where('japaneseLevel', '==', user.japaneseLevel),
      where('targetRole', '==', user.targetRole),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const match = snapshot.docs[0];
      const matchData = match.data();
      
      // Found a match, create room
      const roomRef = doc(collection(db, 'interviewRooms'));
      const roomId = roomRef.id;
      
      const interviewerId = Math.random() > 0.5 ? user.uid : matchData.userId;
      const candidateId = interviewerId === user.uid ? matchData.userId : user.uid;

      await setDoc(roomRef, {
        id: roomId,
        userA: user.uid,
        userB: matchData.userId,
        interviewerId,
        candidateId,
        topic,
        targetRole: user.targetRole,
        status: 'active',
        createdAt: Date.now()
      });

      // Update match status
      await updateDoc(match.ref, { status: 'matched', roomId });
      return roomId;
    } else {
      // No match, join queue
      const docRef = await addDoc(queueRef, {
        userId: user.uid,
        japaneseLevel: user.japaneseLevel,
        targetRole: user.targetRole,
        topic,
        status: 'searching',
        createdAt: Date.now()
      });
      return docRef.id;
    }
  },

  async leaveQueue(queueId: string) {
    await deleteDoc(doc(db, 'matchingQueue', queueId));
  },

  // Room logic
  listenToRoom(roomId: string, callback: (data: InterviewRoomData | null) => void) {
    return onSnapshot(doc(db, 'interviewRooms', roomId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as InterviewRoomData);
      } else {
        callback(null);
      }
    });
  },

  listenToMessages(roomId: string, callback: (messages: Message[]) => void) {
    const messagesRef = collection(db, 'interviewRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      callback(msgs);
    });
  },

  async sendMessage(roomId: string, senderId: string, text: string) {
    const messagesRef = collection(db, 'interviewRooms', roomId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: Date.now()
    });
  },

  async endSession(roomId: string) {
    await updateDoc(doc(db, 'interviewRooms', roomId), {
      status: 'ended',
      endedAt: Date.now()
    });
  },

  async generateQuestions(role: string, level: string, topic: string): Promise<string[]> {
    return aiService.generateInterviewQuestions(role, level, topic);
  },

  async getFeedback(transcript: string): Promise<InterviewFeedback> {
    return aiService.evaluateInterview(transcript);
  },

  async saveInterviewHistory(data: any) {
    await addDoc(collection(db, 'interviewHistory'), {
      ...data,
      createdAt: Date.now()
    });
  }
};
