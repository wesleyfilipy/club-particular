import { supabase } from './supabase';

// Uma sessão por conta: cada login gera um ID deste aparelho e o registra no Supabase.
// Se outro aparelho fizer login na mesma conta, este deixa de ser o ativo e é desconectado.

const SESSION_KEY = 'es_session_id';
const FRESH_KEY = 'es_session_fresh';

const read = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* navegador sem armazenamento */ }
};
const remove = (key: string) => {
  try { localStorage.removeItem(key); } catch { /* idem */ }
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Chamar ANTES de fazer login: este aparelho passa a ser o ativo da conta */
export const startNewSession = () => {
  write(SESSION_KEY, newId());
  write(FRESH_KEY, '1');
};

/**
 * Confirma que este aparelho ainda é o ativo da conta.
 * Retorna false quando a conta foi acessada em outro aparelho depois deste.
 */
export async function verifySession(): Promise<boolean> {
  let id = read(SESSION_KEY);
  if (!id) {
    // Sessão antiga, anterior a este controle: registra este aparelho
    startNewSession();
    id = read(SESSION_KEY);
    if (!id) return true; // sem armazenamento no navegador: não bloqueia
  }

  if (read(FRESH_KEY)) {
    const { error } = await supabase.rpc('es_claim_session', { session_id: id });
    if (!error) remove(FRESH_KEY);
    return true;
  }

  const { data, error } = await supabase.rpc('es_session_is_current', { session_id: id });
  if (error) return true; // SQL da sessão única ainda não instalado: não bloqueia
  return data !== false;
}

export const clearSession = () => {
  remove(SESSION_KEY);
  remove(FRESH_KEY);
};
