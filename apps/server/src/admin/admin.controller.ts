import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ---- Players & Rooms ----

  @Get('players')
  async getPlayers(@Query('take') take?: string, @Query('skip') skip?: string) {
    const players = await this.admin.getPlayers(take ? parseInt(take, 10) : 50, skip ? parseInt(skip, 10) : 0);
    return { success: true, players };
  }

  @Get('rooms')
  getLiveRooms() {
    return { success: true, rooms: this.admin.getLiveRooms() };
  }

  // ---- Weapons ----

  @Get('weapons')
  async getWeapons() {
    return { success: true, weapons: await this.admin.weapons.findAll() };
  }

  @Post('weapons')
  async createWeapon(@Body() body: any) {
    return { success: true, weapon: await this.admin.weapons.create(body) };
  }

  @Put('weapons/:id')
  async updateWeapon(@Param('id') id: string, @Body() body: any) {
    return { success: true, weapon: await this.admin.weapons.update(id, body) };
  }

  @Delete('weapons/:id')
  async deleteWeapon(@Param('id') id: string) {
    await this.admin.weapons.remove(id);
    return { success: true };
  }

  // ---- Maps ----

  @Get('maps')
  async getMaps() {
    return { success: true, maps: await this.admin.maps.findAll() };
  }

  @Post('maps')
  async createMap(@Body() body: any) {
    return { success: true, map: await this.admin.maps.create(body) };
  }

  @Put('maps/:id')
  async updateMap(@Param('id') id: string, @Body() body: any) {
    return { success: true, map: await this.admin.maps.update(id, body) };
  }

  @Delete('maps/:id')
  async deleteMap(@Param('id') id: string) {
    await this.admin.maps.remove(id);
    return { success: true };
  }

  // ---- Characters ----

  @Get('characters')
  async getCharacters() {
    return { success: true, characters: await this.admin.characters.findAll() };
  }

  @Post('characters')
  async createCharacter(@Body() body: any) {
    return { success: true, character: await this.admin.characters.create(body) };
  }

  @Put('characters/:id')
  async updateCharacter(@Param('id') id: string, @Body() body: any) {
    return { success: true, character: await this.admin.characters.update(id, body) };
  }

  @Delete('characters/:id')
  async deleteCharacter(@Param('id') id: string) {
    await this.admin.characters.remove(id);
    return { success: true };
  }

  @Post('characters/:id/parts')
  async createCharacterPart(@Param('id') id: string, @Body() body: any) {
    return { success: true, part: await this.admin.characterParts.create({ ...body, characterId: id }) };
  }

  @Put('characters/:id/parts/:partId')
  async updateCharacterPart(@Param('partId') partId: string, @Body() body: any) {
    return { success: true, part: await this.admin.characterParts.update(partId, body) };
  }

  @Delete('characters/:id/parts/:partId')
  async deleteCharacterPart(@Param('partId') partId: string) {
    await this.admin.characterParts.remove(partId);
    return { success: true };
  }

  // ---- Weapon Skins ----

  @Get('weapons/:weaponId/skins')
  async getWeaponSkins(@Param('weaponId') weaponId: string) {
    return { success: true, skins: await this.admin.weaponSkins.findAll({ weaponId }) };
  }

  @Post('weapons/:weaponId/skins')
  async createWeaponSkin(@Param('weaponId') weaponId: string, @Body() body: any) {
    return { success: true, skin: await this.admin.weaponSkins.create({ ...body, weaponId }) };
  }

  @Put('skins/:id')
  async updateWeaponSkin(@Param('id') id: string, @Body() body: any) {
    return { success: true, skin: await this.admin.weaponSkins.update(id, body) };
  }

  @Delete('skins/:id')
  async deleteWeaponSkin(@Param('id') id: string) {
    await this.admin.weaponSkins.remove(id);
    return { success: true };
  }

  // ---- Crosshairs ----

  @Get('crosshairs')
  async getCrosshairs() {
    return { success: true, crosshairs: await this.admin.crosshairs.findAll() };
  }

  @Post('crosshairs')
  async createCrosshair(@Body() body: any) {
    return { success: true, crosshair: await this.admin.crosshairs.create(body) };
  }

  @Put('crosshairs/:id')
  async updateCrosshair(@Param('id') id: string, @Body() body: any) {
    return { success: true, crosshair: await this.admin.crosshairs.update(id, body) };
  }

  @Delete('crosshairs/:id')
  async deleteCrosshair(@Param('id') id: string) {
    await this.admin.crosshairs.remove(id);
    return { success: true };
  }

  // ---- Jetpacks ----

  @Get('jetpacks')
  async getJetpacks() {
    return { success: true, jetpacks: await this.admin.jetpacks.findAll() };
  }

  @Post('jetpacks')
  async createJetpack(@Body() body: any) {
    return { success: true, jetpack: await this.admin.jetpacks.create(body) };
  }

  @Put('jetpacks/:id')
  async updateJetpack(@Param('id') id: string, @Body() body: any) {
    return { success: true, jetpack: await this.admin.jetpacks.update(id, body) };
  }

  @Delete('jetpacks/:id')
  async deleteJetpack(@Param('id') id: string) {
    await this.admin.jetpacks.remove(id);
    return { success: true };
  }

  // ---- Power-Ups ----

  @Get('powerups')
  async getPowerUps() {
    return { success: true, powerUps: await this.admin.powerUps.findAll() };
  }

  @Post('powerups')
  async createPowerUp(@Body() body: any) {
    return { success: true, powerUp: await this.admin.powerUps.create(body) };
  }

  @Put('powerups/:id')
  async updatePowerUp(@Param('id') id: string, @Body() body: any) {
    return { success: true, powerUp: await this.admin.powerUps.update(id, body) };
  }

  @Delete('powerups/:id')
  async deletePowerUp(@Param('id') id: string) {
    await this.admin.powerUps.remove(id);
    return { success: true };
  }

  // ---- Game Modes ----

  @Get('gamemodes')
  async getGameModes() {
    return { success: true, gameModes: await this.admin.gameModes.findAll() };
  }

  @Post('gamemodes')
  async createGameMode(@Body() body: any) {
    return { success: true, gameMode: await this.admin.gameModes.create(body) };
  }

  @Put('gamemodes/:id')
  async updateGameMode(@Param('id') id: string, @Body() body: any) {
    return { success: true, gameMode: await this.admin.gameModes.update(id, body) };
  }

  @Delete('gamemodes/:id')
  async deleteGameMode(@Param('id') id: string) {
    await this.admin.gameModes.remove(id);
    return { success: true };
  }

  // ---- Themes ----

  @Get('themes')
  async getThemes() {
    return { success: true, themes: await this.admin.themes.findAll() };
  }

  @Post('themes')
  async createTheme(@Body() body: any) {
    return { success: true, theme: await this.admin.themes.create(body) };
  }

  @Put('themes/:id')
  async updateTheme(@Param('id') id: string, @Body() body: any) {
    return { success: true, theme: await this.admin.themes.update(id, body) };
  }

  @Delete('themes/:id')
  async deleteTheme(@Param('id') id: string) {
    await this.admin.themes.remove(id);
    return { success: true };
  }

  // ---- Assets ----

  @Get('assets')
  async getAssets(@Query('type') type?: string) {
    return { success: true, assets: await this.admin.assets.findAll(type ? { type } : undefined) };
  }

  @Post('assets/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(@UploadedFile() file: any, @Body() body: any) {
    if (!file) return { success: false, error: 'No file uploaded' };
    const asset = await this.admin.assets.create({
      name: body.name || file.originalname,
      type: body.type || 'image',
      path: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      metadata: body.metadata ? JSON.parse(body.metadata) : {},
    });
    return { success: true, asset };
  }

  @Delete('assets/:id')
  async deleteAsset(@Param('id') id: string) {
    await this.admin.assets.remove(id);
    return { success: true };
  }

  // ---- Scripts ----

  @Get('scripts')
  async getScripts() {
    return { success: true, scripts: await this.admin.scripts.findAll() };
  }

  @Get('scripts/:id')
  async getScript(@Param('id') id: string) {
    const script = await this.admin.scripts.findById(id);
    return script ? { success: true, script } : { success: false, error: 'Script not found' };
  }

  @Post('scripts')
  async createScript(@Body() body: any) {
    return { success: true, script: await this.admin.scripts.create(body) };
  }

  @Put('scripts/:id')
  async updateScript(@Param('id') id: string, @Body() body: any) {
    return { success: true, script: await this.admin.scripts.update(id, body) };
  }

  @Delete('scripts/:id')
  async deleteScript(@Param('id') id: string) {
    await this.admin.scripts.remove(id);
    return { success: true };
  }

  // ---- Content Versions ----

  @Get('versions')
  async getVersions(@Query('entityType') entityType?: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    return { success: true, versions: await this.admin.getVersions(entityType, skip ? parseInt(skip, 10) : 0, take ? parseInt(take, 10) : 50) };
  }

  @Post('versions')
  async createVersion(@Body() body: any) {
    return { success: true, version: await this.admin.createVersion(body) };
  }

  @Post('versions/:id/restore')
  async restoreVersion(@Param('id') id: string) {
    return { success: true, data: await this.admin.restoreVersion(id) };
  }

  // ---- Game Settings ----

  @Get('settings')
  async getSettings() {
    return { success: true, settings: await this.admin.getSettings() };
  }

  @Put('settings')
  async updateSetting(@Body() body: { key: string; value: any }) {
    return { success: true, setting: await this.admin.updateSetting(body.key, body.value) };
  }

  // ---- Live Testing ----

  @Post('testing/start')
  async startTest(@Body() body: { mapId: string; mode: string; maxPlayers: number }) {
    return { success: true, session: await this.admin.startTestSession(body) };
  }

  @Get('testing/sessions')
  async getTestSessions() {
    return { success: true, sessions: await this.admin.getTestSessions() };
  }

  @Get('testing/results')
  async getTestResults() {
    return { success: true, results: await this.admin.getTestResults() };
  }

  @Post('testing/:id/stop')
  async stopTest(@Param('id') id: string) {
    return { success: true, ...(await this.admin.stopTestSession(id)) };
  }

  // ---- Publishing ----

  @Get('publishing/changes')
  async getPublishChanges() {
    return { success: true, changes: await this.admin.getPublishChanges() };
  }

  @Post('publishing/publish')
  async publish(@Body() body: { entityType: string; entityId: string }) {
    await this.admin.publishEntity(body.entityType, body.entityId);
    return { success: true };
  }

  @Post('publishing/publish-all')
  async publishAll() {
    return { success: true, ...(await this.admin.publishAll()) };
  }

  @Get('publishing/history')
  async getPublishHistory() {
    return { success: true, history: await this.admin.getPublishHistory() };
  }
}
