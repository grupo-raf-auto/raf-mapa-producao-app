import { Request, Response } from 'express';
import { AppSettingsRepository } from '../repositories/app-settings.repository';
import logger from '../lib/logger';

export class AppSettingsController {
  private repository: AppSettingsRepository;

  constructor() {
    this.repository = new AppSettingsRepository();
  }

  /**
   * GET /api/app-settings
   * Retorna as configurações atuais da aplicação
   * Público - qualquer utilizador pode ver as configurações
   */
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await this.repository.getOrCreateSettings();

      // Retornar configurações
      return res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching app settings');
      return res.status(500).json({
        success: false,
        error: 'Erro ao carregar as configurações da aplicação',
      });
    }
  }

  /**
   * PUT /api/app-settings
   * Atualiza as configurações da aplicação
   * Apenas ADMIN pode atualizar
   */
  async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verificar se é admin
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem alterar as configurações',
        });
      }

      const {
        sidebarLogo,
        sidebarText,
        primaryColor,
        secondaryColor,
        accentColor,
        sidebarColor,
        theme,
        customButtonEnabled,
        customButtonLabel,
        customButtonColor,
        customButtonUrl,
        openaiModelSabichao,
        openaiModelAssistente,
        openaiModelScanner,
        openaiModelMyTexto,
      } = req.body;

      // Validações
      if (theme && !['light', 'dark', 'system'].includes(theme)) {
        return res.status(400).json({
          success: false,
          error: 'Tema inválido. Use: light, dark ou system',
        });
      }

      // Validar cores (formato hexadecimal)
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (primaryColor && !colorRegex.test(primaryColor)) {
        return res.status(400).json({
          success: false,
          error: 'Cor primária inválida. Use formato hexadecimal (#RRGGBB)',
        });
      }
      if (secondaryColor && !colorRegex.test(secondaryColor)) {
        return res.status(400).json({
          success: false,
          error: 'Cor secundária inválida. Use formato hexadecimal (#RRGGBB)',
        });
      }
      if (accentColor && !colorRegex.test(accentColor)) {
        return res.status(400).json({
          success: false,
          error: 'Cor de destaque inválida. Use formato hexadecimal (#RRGGBB)',
        });
      }
      if (sidebarColor && !colorRegex.test(sidebarColor)) {
        return res.status(400).json({
          success: false,
          error: 'Cor da sidebar inválida. Use formato hexadecimal (#RRGGBB)',
        });
      }
      if (customButtonColor && !colorRegex.test(customButtonColor)) {
        return res.status(400).json({
          success: false,
          error: 'Cor do botão inválida. Use formato hexadecimal (#RRGGBB)',
        });
      }

      // Validar URL do botão customizado
      if (customButtonUrl) {
        try {
          new URL(customButtonUrl);
        } catch {
          return res.status(400).json({
            success: false,
            error: 'URL do botão inválida',
          });
        }
      }

      // Validar modelos OpenAI (string válida ou null/vazio para default)
      const validateModel = (v: unknown) =>
        v === null ||
        v === undefined ||
        v === '' ||
        (typeof v === 'string' && /^[a-zA-Z0-9.-]+$/.test(v.trim()));
      if (openaiModelSabichao !== undefined && !validateModel(openaiModelSabichao)) {
        return res.status(400).json({
          success: false,
          error: 'Modelo MySabichao inválido. Use um identificador de modelo OpenAI (ex: gpt-4o, gpt-4o-mini).',
        });
      }
      if (openaiModelAssistente !== undefined && !validateModel(openaiModelAssistente)) {
        return res.status(400).json({
          success: false,
          error: 'Modelo Assistente RAF inválido.',
        });
      }
      if (openaiModelScanner !== undefined && !validateModel(openaiModelScanner)) {
        return res.status(400).json({
          success: false,
          error: 'Modelo MyScanner inválido.',
        });
      }
      if (openaiModelMyTexto !== undefined && !validateModel(openaiModelMyTexto)) {
        return res.status(400).json({
          success: false,
          error: 'Modelo MyTexto inválido.',
        });
      }

      // Atualizar configurações
      const settings = await this.repository.updateSettings({
        sidebarLogo,
        sidebarText,
        primaryColor,
        secondaryColor,
        accentColor,
        sidebarColor,
        theme,
        customButtonEnabled,
        customButtonLabel,
        customButtonColor,
        customButtonUrl,
        openaiModelSabichao: openaiModelSabichao || null,
        openaiModelAssistente: openaiModelAssistente || null,
        openaiModelScanner: openaiModelScanner || null,
        openaiModelMyTexto: openaiModelMyTexto || null,
        updatedBy: userId,
      });

      logger.info(`App settings updated by admin ${userId}`);

      return res.json({
        success: true,
        data: settings,
        message: 'Configurações atualizadas com sucesso',
      });
    } catch (error) {
      logger.error({ err: error }, 'Error updating app settings');
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar as configurações da aplicação',
      });
    }
  }

  /**
   * POST /api/app-settings/reset
   * Restaura as configurações para os valores padrão
   * Apenas ADMIN pode resetar
   */
  async resetSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verificar se é admin
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem resetar as configurações',
        });
      }

      // Resetar para valores padrão
      const settings = await this.repository.resetToDefaults(userId);

      logger.info(`App settings reset to defaults by admin ${userId}`);

      return res.json({
        success: true,
        data: settings,
        message: 'Configurações restauradas para os valores padrão',
      });
    } catch (error) {
      logger.error({ err: error }, 'Error resetting app settings');
      return res.status(500).json({
        success: false,
        error: 'Erro ao restaurar as configurações',
      });
    }
  }
}
