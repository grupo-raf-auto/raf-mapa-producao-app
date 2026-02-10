/**
 * Utilitários para formatação de respostas da API
 */

/**
 * Adiciona campo _id como alias de id para compatibilidade com clientes legados
 * @param item - Objeto com campo id
 * @returns Objeto com _id adicionado
 */
export function withLegacyId<T extends { id: string }>(
  item: T
): T & { _id: string } {
  return { ...item, _id: item.id };
}

/**
 * Mapeia array adicionando _id a cada item
 * @param items - Array de objetos com campo id
 * @returns Array com _id adicionado em cada item
 */
export function withLegacyIds<T extends { id: string }>(
  items: T[]
): (T & { _id: string })[] {
  return items.map(withLegacyId);
}

/**
 * Cria resposta de sucesso padronizada
 */
export function successResponse<T>(data: T) {
  return { success: true, data };
}

/**
 * Cria resposta de erro padronizada
 */
export function errorResponse(message: string, code?: string) {
  return { success: false, error: message, code };
}
