import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateSettingsData {
  sidebarLogo?: string | null;
  sidebarText?: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  sidebarColor?: string | null;
  theme?: string;
  customButtonEnabled?: boolean;
  customButtonLabel?: string;
  customButtonColor?: string;
  customButtonUrl?: string;
  updatedBy?: string;
}

export class AppSettingsRepository {
  /**
   * Obtém as configurações atuais ou cria com valores padrão se não existirem
   */
  async getOrCreateSettings() {
    // Tentar obter as configurações existentes
    let settings = await prisma.appSettings.findFirst({
      orderBy: { version: 'desc' },
    });

    // Se não existirem, criar com valores padrão
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          theme: 'light',
          customButtonEnabled: true,
          customButtonLabel: 'CRM MyCredit',
          customButtonColor: '#22c55e', // green-500
          customButtonUrl: 'https://mycredit.pt',
          version: 1,
        },
      });
    }

    return settings;
  }

  /**
   * Atualiza as configurações existentes
   */
  async updateSettings(data: UpdateSettingsData) {
    // Obter configurações atuais
    const currentSettings = await this.getOrCreateSettings();

    // Atualizar apenas os campos fornecidos
    const updatedSettings = await prisma.appSettings.update({
      where: { id: currentSettings.id },
      data: {
        ...(data.sidebarLogo !== undefined && { sidebarLogo: data.sidebarLogo }),
        ...(data.sidebarText !== undefined && { sidebarText: data.sidebarText }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.secondaryColor !== undefined && {
          secondaryColor: data.secondaryColor,
        }),
        ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
        ...(data.sidebarColor !== undefined && { sidebarColor: data.sidebarColor }),
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.customButtonEnabled !== undefined && {
          customButtonEnabled: data.customButtonEnabled,
        }),
        ...(data.customButtonLabel !== undefined && {
          customButtonLabel: data.customButtonLabel,
        }),
        ...(data.customButtonColor !== undefined && {
          customButtonColor: data.customButtonColor,
        }),
        ...(data.customButtonUrl !== undefined && {
          customButtonUrl: data.customButtonUrl,
        }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
        version: { increment: 1 },
      },
    });

    return updatedSettings;
  }

  /**
   * Restaura as configurações para os valores padrão
   */
  async resetToDefaults(updatedBy?: string) {
    // Obter configurações atuais
    const currentSettings = await this.getOrCreateSettings();

    // Resetar para valores padrão
    const resetSettings = await prisma.appSettings.update({
      where: { id: currentSettings.id },
      data: {
        sidebarLogo: null,
        sidebarText: 'Grupo RAF',
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
        sidebarColor: null,
        theme: 'light',
        customButtonEnabled: true,
        customButtonLabel: 'CRM MyCredit',
        customButtonColor: '#22c55e', // green-500
        customButtonUrl: 'https://mycredit.pt',
        updatedBy: updatedBy || null,
        version: { increment: 1 },
      },
    });

    return resetSettings;
  }
}
