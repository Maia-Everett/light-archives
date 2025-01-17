<template>
  <q-layout view="hHh Lpr fff">
    <q-header>
      <q-toolbar class="layout__toolbar__header">
        <div class="layout__filler">
          <div class="gt-sm layout__char-name">
            <template v-if="$store.getters.character">
              <q-avatar round>
                <img :src="$store.getters.character.avatar" />
              </q-avatar>
              <span>{{ $store.getters.characterShortName }}</span>
            </template>
            <template v-else>
              <q-icon size="28px" name="account_circle" />
              <span>Eine fremde Gestalt</span>
            </template>
          </div>
        </div>
        <div class="layout__filler__end center justify-end">
          <q-btn-group flat class="gt-sm">
          <template v-if="$store.getters.character">
            <q-btn square padding="10px" flat class="layout__toolbar__button" label="Charakter wechseln" @click="switchCharacter" />&nbsp;
            <q-btn square padding="10px" flat class="layout__toolbar__button" label="Abmelden" @click="logOut" />
          </template>
          <template v-else>
            <q-btn square padding="10px" flat class="layout__toolbar__button" label="Registrieren" to="/signup" />&nbsp;
            <q-btn square padding="10px" flat class="layout__toolbar__button" label="Einloggen" to="/login" />
          </template>
        </q-btn-group>
        <q-btn-dropdown flat class="layout__toolbar-button-more lt-md" dropdown-icon="more_horiz">
          <template v-if="$store.getters.character">
            <q-list>
              <q-item to="/switchCharacter">
                <q-item-section>
                  <q-item-label>Charakter wechseln</q-item-label>
                </q-item-section>
              </q-item>
              <q-item to="/logOut">
                <q-item-section>
                  <q-item-label>Abmelden</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </template>
          <template v-else>
            <q-list>
              <q-item to="/signup">
                <q-item-section>
                  <q-item-label>Registrieren</q-item-label>
                </q-item-section>
              </q-item>
              <q-item to="/login">
                <q-item-section>
                  <q-item-label>Einloggen</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </template>

          </q-btn-dropdown>
        </div>
      </q-toolbar>



    </q-header>



    <q-page-container>
      <q-toolbar-title class="layout__toolbar-title">
          <router-link to="/">
            <picture>
              <source
                srcset="
                  ~/assets/logo_1x.webp,
                  ~/assets/logo_2x.webp 2x,
                  ~/assets/logo_3x.webp 3x,
                  ~/assets/logo_4x.webp 4x
                "
                type="image/webp"
              />
              <source
                srcset="~/assets/logo_2x.png 2x, ~/assets/logo_3x.png 3x, ~/assets/logo_4x.png 4x"
              />
              <img class="layout__logo" src="~/assets/logo_1x.png" />
            </picture>
          </router-link>
        </q-toolbar-title>

      <nav class="layout__nav-links gt-sm">
        <router-link v-for="link in siteLinks" :key="link.label" :to="link.to">{{ link.label }}</router-link>
      </nav>

      <div class="layout__page-container">
        <router-view />
      </div>
    </q-page-container>

    <q-footer elevated>
      <q-toolbar class="layout__toolbar__footer">
        <div class="layout__footer text-body justify-center text-center">
          Final Fantasy XIV © 2010&ndash;2023 Square Enix Co., Ltd. Alle Rechte vorbehalten. Elpisgarten ist eine
          Fanseite und steht nicht mit Square Enix in Verbindung.<br />
          Alle Rechte der Texte und Bilder © 2022–2023 liegen bei ihren jeweiligen Eigentümern.
          <router-link to="/privacy-statement">(Datenschutzerklärung)</router-link>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import EventList from '../components/eventbar/EventList.vue';
import UserMenu from '../components/sidebar/UserMenu.vue';
import InlineSvg from 'vue-inline-svg';
import SiteSearchField from 'src/components/search/SiteSearchField.vue';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { notifySuccess } from 'src/common/notify';

@Options({
  components: {
    EventList,
    UserMenu,
    InlineSvg,
    SiteSearchField,
  },
})
export default class MainLayout extends Vue {
  readonly DRAWER_BG = 'layout__drawer';
  readonly DRAWER_WIDTH = 250;

  readonly navbarLinks = [
    { label: 'Über uns', to: '/about' },
    { label: 'Regeln', to: '/rules' },
    { label: 'Wiki', to: '/wiki/Chaos_Archives_Wiki' },
    { label: 'Kontakt', to: '/contact' },
  ];

  readonly siteLinks = [
    { label: 'Charaktere', to: '/profiles' },
    { label: 'Treffpunkte', to: '/venues' },
    { label: 'Anschlagbrett', to: '/noticeboard' },
    { label: 'Communities', to: '/communities' },
    { label: 'Freie Gesellschaften', to: '/free-companies' },
    { label: 'Screenshots', to: '/gallery/screenshot' },
    { label: 'Kunstwerke', to: '/gallery/artwork' },
    { label: 'Geschichten', to: '/stories' },
  ];

  leftDrawerOpen = false;
  rightDrawerOpen = false;

  async switchCharacter() {
    const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;

    this.$q
      .dialog({
        component: SwitchCharacterDialog,
      })
      .onOk((character: SessionCharacterDto) => {
        if (character.verified) {
          void this.$router.push('/');
        } else {
          void this.$router.push('/verify');
        }
      });
  }

  logOut() {
    this.$store.commit('setUser', null);
    this.$api.setAccessToken(null);
    notifySuccess('Du hast dich ausgeloggt.');
    void this.$router.push('/');
  }

}
</script>

<style lang="scss">
$max-layout-width: auto;

.q-layout {
  /* box-shadow: rgba(black, 0.2) 8px 0px 4px, rgba(black, 0.2) -8px 0 4px; */
  outline: 1px solid #505050;
}

.layout__filler {
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__filler__end {
  color:black;
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__char-name {
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.layout__char-name span {
  padding-left: 6px;
}

.layout__toolbar-title {
  flex-basis: inherit;
  flex-grow: 0;
}

.layout__toolbar-title a {
  color: inherit;
  text-decoration: inherit;
  border-bottom: none;
}

.q-toolbar__title {
  font-family: Michroma, sans-serif;
  font-weight: bold;
  padding-top: 50px;
  padding-bottom: 50px;
  padding-left: 8px;
  padding-right: 8px;
  max-width: 1300px;
  margin: auto;
  text-align: left;
}

.layout__toolbar-title svg {
  width: 400px;
  max-width: 100%;
}

.layout__toolbar-title g {
  fill: #f8f8f8 !important;
}

.layout__toolbar-title:hover g {
  fill: #e8e8e8 !important;
}

.layout__logo {
  filter: brightness(1.05);
  width: 540px;
  max-width: 100%;
  transition: all 0.3s ease;
}

.layout__logo:hover {
  filter: brightness(1.125);
}

.layout__toolbar-button-more {
  padding-left: 4px;
  padding-right: 4px;
}

.q-header {
  background-color: transparent;
  border-radius: 0px;
}

.layout__toolbar__header {
  background-image: -webkit-linear-gradient(-25deg, black 75%, #D9D9D9 25.3%);
  font-family: Montserrat, sans-serif;
  color: white;
}

.layout__toolbar__footer {
  background: black;
  color: white;
}

.layout__nav-links {
  max-width: 1300px;
  margin: auto;
  background: linear-gradient(to bottom, #ddb476, #ddb476);
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  text-align: center;
  font-size: 16px;
}

.layout__nav-links a {
  display: inline-block;
  padding: 6px 30px 6px 30px;
  color: black;
  transition: all 0.3s ease;
  font-family: Montserrat, sans-serif;
  font-size: small;
}

.layout__nav-links a:hover {
  background: rgba(255, 255, 255, 0.15);
}

.layout__nav-links .router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

@media screen and (min-width: 1024px) {
  body {
    overflow-y: scroll;
  }
}

.layout__create-content-list {
  padding-left: 12px;
  background: #016097;
}

.layout__page-container {
  max-width: 1300px;
  margin: auto;
  background: #fdfdffee;
  border-radius: 30px 30px 0px 0px;
}

.q-page {
  padding: 24px 24px 48px 24px;
  margin-top: 30px;
}

@media screen and (max-width: $breakpoint-sm) {
  .q-page {
    padding: 18px 18px 36px 18px;
  }
}

@media screen and (max-width: $breakpoint-xs) {
  .q-page {
    padding: 12px 12px 24px 12px;
  }
}

.q-footer {
  background: #ebebeb;
  color: black;
}

.layout__footer {
  flex-grow: 1;
}

.layout__footer a {
  color: #777;
}

.layout__footer a:hover {
  color: #bbb;
}

@media screen and (min-width: $max-layout-width) {
  .q-layout,
  .q-header {
    max-width: $max-layout-width;
    margin: auto;
  }
}
</style>
