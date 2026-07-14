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
  constructor(private readonly adminService: AdminService) {}

  @Get('players')
  async getPlayers(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = take ? parseInt(take, 10) : 50;
    const offset = skip ? parseInt(skip, 10) : 0;
    const players = await this.adminService.getPlayers(limit, offset);
    return { success: true, players };
  }

  @Get('rooms')
  getLiveRooms() {
    const rooms = this.adminService.getLiveRooms();
    return { success: true, rooms };
  }

  // ============================================================
  // WEAPONS CRUD
  // ============================================================

  @Get('weapons')
  async getWeapons() {
    const weapons = await this.adminService.getWeapons();
    return { success: true, weapons };
  }

  @Post('weapons')
  async createWeapon(@Body() body: any) {
    const weapon = await this.adminService.createWeapon(body);
    return { success: true, weapon };
  }

  @Put('weapons/:id')
  async updateWeapon(@Param('id') id: string, @Body() body: any) {
    const weapon = await this.adminService.updateWeapon(id, body);
    return { success: true, weapon };
  }

  @Delete('weapons/:id')
  async deleteWeapon(@Param('id') id: string) {
    await this.adminService.deleteWeapon(id);
    return { success: true };
  }

  // ============================================================
  // MAPS CRUD
  // ============================================================

  @Get('maps')
  async getMaps() {
    const maps = await this.adminService.getMaps();
    return { success: true, maps };
  }

  @Post('maps')
  async createMap(@Body() body: any) {
    const map = await this.adminService.createMap(body);
    return { success: true, map };
  }

  @Put('maps/:id')
  async updateMap(@Param('id') id: string, @Body() body: any) {
    const map = await this.adminService.updateMap(id, body);
    return { success: true, map };
  }

  @Delete('maps/:id')
  async deleteMap(@Param('id') id: string) {
    await this.adminService.deleteMap(id);
    return { success: true };
  }

  // ============================================================
  // CHARACTERS CRUD
  // ============================================================

  @Get('characters')
  async getCharacters() {
    const characters = await this.adminService.getCharacters();
    return { success: true, characters };
  }

  @Post('characters')
  async createCharacter(@Body() body: any) {
    const character = await this.adminService.createCharacter(body);
    return { success: true, character };
  }

  @Put('characters/:id')
  async updateCharacter(@Param('id') id: string, @Body() body: any) {
    const character = await this.adminService.updateCharacter(id, body);
    return { success: true, character };
  }

  @Delete('characters/:id')
  async deleteCharacter(@Param('id') id: string) {
    await this.adminService.deleteCharacter(id);
    return { success: true };
  }

  @Post('characters/:id/parts')
  async createCharacterPart(@Param('id') id: string, @Body() body: any) {
    const part = await this.adminService.createCharacterPart(id, body);
    return { success: true, part };
  }

  @Put('characters/:id/parts/:partId')
  async updateCharacterPart(
    @Param('id') _id: string,
    @Param('partId') partId: string,
    @Body() body: any,
  ) {
    const part = await this.adminService.updateCharacterPart(partId, body);
    return { success: true, part };
  }

  @Delete('characters/:id/parts/:partId')
  async deleteCharacterPart(
    @Param('id') _id: string,
    @Param('partId') partId: string,
  ) {
    await this.adminService.deleteCharacterPart(partId);
    return { success: true };
  }

  // ============================================================
  // WEAPON SKINS
  // ============================================================

  @Get('weapons/:weaponId/skins')
  async getWeaponSkins(@Param('weaponId') weaponId: string) {
    const skins = await this.adminService.getWeaponSkins(weaponId);
    return { success: true, skins };
  }

  @Post('weapons/:weaponId/skins')
  async createWeaponSkin(@Param('weaponId') weaponId: string, @Body() body: any) {
    const skin = await this.adminService.createWeaponSkin({ ...body, weaponId });
    return { success: true, skin };
  }

  @Put('skins/:id')
  async updateWeaponSkin(@Param('id') id: string, @Body() body: any) {
    const skin = await this.adminService.updateWeaponSkin(id, body);
    return { success: true, skin };
  }

  @Delete('skins/:id')
  async deleteWeaponSkin(@Param('id') id: string) {
    await this.adminService.deleteWeaponSkin(id);
    return { success: true };
  }

  // ============================================================
  // CROSSHAIRS CRUD
  // ============================================================

  @Get('crosshairs')
  async getCrosshairs() {
    const crosshairs = await this.adminService.getCrosshairs();
    return { success: true, crosshairs };
  }

  @Post('crosshairs')
  async createCrosshair(@Body() body: any) {
    const crosshair = await this.adminService.createCrosshair(body);
    return { success: true, crosshair };
  }

  @Put('crosshairs/:id')
  async updateCrosshair(@Param('id') id: string, @Body() body: any) {
    const crosshair = await this.adminService.updateCrosshair(id, body);
    return { success: true, crosshair };
  }

  @Delete('crosshairs/:id')
  async deleteCrosshair(@Param('id') id: string) {
    await this.adminService.deleteCrosshair(id);
    return { success: true };
  }

  // ============================================================
  // JETPACKS CRUD
  // ============================================================

  @Get('jetpacks')
  async getJetpacks() {
    const jetpacks = await this.adminService.getJetpacks();
    return { success: true, jetpacks };
  }

  @Post('jetpacks')
  async createJetpack(@Body() body: any) {
    const jetpack = await this.adminService.createJetpack(body);
    return { success: true, jetpack };
  }

  @Put('jetpacks/:id')
  async updateJetpack(@Param('id') id: string, @Body() body: any) {
    const jetpack = await this.adminService.updateJetpack(id, body);
    return { success: true, jetpack };
  }

  @Delete('jetpacks/:id')
  async deleteJetpack(@Param('id') id: string) {
    await this.adminService.deleteJetpack(id);
    return { success: true };
  }

  // ============================================================
  // POWER-UPS CRUD
  // ============================================================

  @Get('powerups')
  async getPowerUps() {
    const powerUps = await this.adminService.getPowerUps();
    return { success: true, powerUps };
  }

  @Post('powerups')
  async createPowerUp(@Body() body: any) {
    const powerUp = await this.adminService.createPowerUp(body);
    return { success: true, powerUp };
  }

  @Put('powerups/:id')
  async updatePowerUp(@Param('id') id: string, @Body() body: any) {
    const powerUp = await this.adminService.updatePowerUp(id, body);
    return { success: true, powerUp };
  }

  @Delete('powerups/:id')
  async deletePowerUp(@Param('id') id: string) {
    await this.adminService.deletePowerUp(id);
    return { success: true };
  }

  // ============================================================
  // GAME MODES CRUD
  // ============================================================

  @Get('gamemodes')
  async getGameModes() {
    const gameModes = await this.adminService.getGameModes();
    return { success: true, gameModes };
  }

  @Post('gamemodes')
  async createGameMode(@Body() body: any) {
    const gameMode = await this.adminService.createGameMode(body);
    return { success: true, gameMode };
  }

  @Put('gamemodes/:id')
  async updateGameMode(@Param('id') id: string, @Body() body: any) {
    const gameMode = await this.adminService.updateGameMode(id, body);
    return { success: true, gameMode };
  }

  @Delete('gamemodes/:id')
  async deleteGameMode(@Param('id') id: string) {
    await this.adminService.deleteGameMode(id);
    return { success: true };
  }

  // ============================================================
  // THEMES CRUD
  // ============================================================

  @Get('themes')
  async getThemes() {
    const themes = await this.adminService.getThemes();
    return { success: true, themes };
  }

  @Post('themes')
  async createTheme(@Body() body: any) {
    const theme = await this.adminService.createTheme(body);
    return { success: true, theme };
  }

  @Put('themes/:id')
  async updateTheme(@Param('id') id: string, @Body() body: any) {
    const theme = await this.adminService.updateTheme(id, body);
    return { success: true, theme };
  }

  @Delete('themes/:id')
  async deleteTheme(@Param('id') id: string) {
    await this.adminService.deleteTheme(id);
    return { success: true };
  }

  // ============================================================
  // ASSETS
  // ============================================================

  @Get('assets')
  async getAssets(@Query('type') type?: string) {
    const assets = await this.adminService.getAssets(type);
    return { success: true, assets };
  }

  @Post('assets/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    const asset = await this.adminService.createAsset({
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
    await this.adminService.deleteAsset(id);
    return { success: true };
  }

  // ============================================================
  // SCRIPTS CRUD
  // ============================================================

  @Get('scripts')
  async getScripts() {
    const scripts = await this.adminService.getScripts();
    return { success: true, scripts };
  }

  @Get('scripts/:id')
  async getScript(@Param('id') id: string) {
    const script = await this.adminService.getScript(id);
    if (!script) {
      return { success: false, error: 'Script not found' };
    }
    return { success: true, script };
  }

  @Post('scripts')
  async createScript(@Body() body: any) {
    const script = await this.adminService.createScript(body);
    return { success: true, script };
  }

  @Put('scripts/:id')
  async updateScript(@Param('id') id: string, @Body() body: any) {
    const script = await this.adminService.updateScript(id, body);
    return { success: true, script };
  }

  @Delete('scripts/:id')
  async deleteScript(@Param('id') id: string) {
    await this.adminService.deleteScript(id);
    return { success: true };
  }

  // ============================================================
  // CONTENT VERSIONS
  // ============================================================

  @Get('versions')
  async getVersions(
    @Query('entityType') entityType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const versions = await this.adminService.getVersions(
      entityType,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 50,
    );
    return { success: true, versions };
  }

  @Post('versions')
  async createVersion(@Body() body: any) {
    const version = await this.adminService.createVersion(body);
    return { success: true, version };
  }

  @Post('versions/:id/restore')
  async restoreVersion(@Param('id') id: string) {
    const result = await this.adminService.restoreVersion(id);
    return { success: true, data: result };
  }

  // ============================================================
  // GAME SETTINGS
  // ============================================================

  @Get('settings')
  async getSettings() {
    const settings = await this.adminService.getSettings();
    return { success: true, settings };
  }

  @Put('settings')
  async updateSetting(@Body() body: { key: string; value: any }) {
    const setting = await this.adminService.updateSetting(body.key, body.value);
    return { success: true, setting };
  }

  // ============================================================
  // LIVE TESTING
  // ============================================================

  @Post('testing/start')
  async startTest(@Body() body: { mapId: string; mode: string; maxPlayers: number }) {
    const session = await this.adminService.startTestSession(body);
    return { success: true, session };
  }

  @Get('testing/sessions')
  async getTestSessions() {
    const sessions = await this.adminService.getTestSessions();
    return { success: true, sessions };
  }

  @Get('testing/results')
  async getTestResults() {
    const results = await this.adminService.getTestResults();
    return { success: true, results };
  }

  @Post('testing/:id/stop')
  async stopTest(@Param('id') id: string) {
    const result = await this.adminService.stopTestSession(id);
    return { success: true, ...result };
  }

  // ============================================================
  // PUBLISHING
  // ============================================================

  @Get('publishing/changes')
  async getPublishChanges() {
    const changes = await this.adminService.getPublishChanges();
    return { success: true, changes };
  }

  @Post('publishing/publish')
  async publish(@Body() body: { entityType: string; entityId: string }) {
    await this.adminService.publishEntity(body.entityType, body.entityId);
    return { success: true };
  }

  @Post('publishing/publish-all')
  async publishAll() {
    const result = await this.adminService.publishAll();
    return { success: true, ...result };
  }

  @Get('publishing/history')
  async getPublishHistory() {
    const history = await this.adminService.getPublishHistory();
    return { success: true, history };
  }
}
