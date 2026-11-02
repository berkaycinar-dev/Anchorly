import { useId, useState } from "react";
import { Languages, Palette, User } from "lucide-react";
import Icon from "../components/Icon";
import AccountPanel from "../components/settings/AccountPanel";
import SegmentedOptions from "../components/settings/SegmentedOptions";
import SettingsRow from "../components/settings/SettingsRow";
import ThemeSwatches from "../components/settings/ThemeSwatches";
import useAuth from "../auth/useAuth";
import { AUTH_STATUS } from "../auth/authStatus";
import { FONTS, THEMES } from "../constants/settings";

const DEFAULT_CATEGORY = "look";

export default function SettingsPage({
  t,
  theme,
  setTheme,
  language,
  setLanguage,
  fontFamily,
  setFontFamily,
  weekStartDay,
  setWeekStartDay,
}) {
  const { status, user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const headingId = useId();

  const categories = [
    ...(status === AUTH_STATUS.signedIn
      ? [{ id: "account", label: t.settingsCategoryAccount, icon: User }]
      : []),
    { id: "look", label: t.settingsCategoryLook, icon: Palette },
    { id: "region", label: t.settingsCategoryRegion, icon: Languages },
  ];

  const activeId = categories.some(
    (category) => category.id === selectedCategory,
  )
    ? selectedCategory
    : DEFAULT_CATEGORY;
  const activeCategory = categories.find(
    (category) => category.id === activeId,
  );

  const fontOptions = FONTS.map((font) => ({
    value: font,
    label: font,
    fontFamily: `'${font}', system-ui, sans-serif`,
  }));
  const languageOptions = [
    { value: "tr", label: t.languageNameTr },
    { value: "en", label: t.languageNameEn },
  ];
  const weekStartOptions = [
    { value: "monday", label: t.weekStartMonday },
    { value: "sunday", label: t.weekStartSunday },
  ];

  return (
    <section className="settings-page">
      <p className="settings-description">{t.settingsDescription}</p>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t.settingsCategoriesLabel}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="settings-nav-item"
              aria-current={category.id === activeId ? "true" : undefined}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Icon icon={category.icon} />
              {category.label}
            </button>
          ))}
        </nav>

        <section className="settings-panel" aria-labelledby={headingId}>
          <h3 id={headingId} className="settings-panel-title">
            {activeCategory.label}
          </h3>

          {activeId === "account" && (
            <AccountPanel t={t} user={user} logout={logout} />
          )}

          {activeId === "look" && (
            <>
              <SettingsRow
                label={t.themeLabel}
                description={`${t.themeSelected}: ${t.themeNames[theme]}`}
              >
                <ThemeSwatches
                  label={t.themeLabel}
                  themes={THEMES}
                  names={t.themeNames}
                  value={theme}
                  onChange={setTheme}
                />
              </SettingsRow>
              <SettingsRow label={t.fontLabel} description={t.fontDescription}>
                <SegmentedOptions
                  label={t.fontLabel}
                  options={fontOptions}
                  value={fontFamily}
                  onChange={setFontFamily}
                />
              </SettingsRow>
            </>
          )}

          {activeId === "region" && (
            <>
              <SettingsRow
                label={t.languageLabel}
                description={t.languageDescription}
              >
                <SegmentedOptions
                  label={t.languageLabel}
                  options={languageOptions}
                  value={language}
                  onChange={setLanguage}
                />
              </SettingsRow>
              <SettingsRow
                label={t.weekStartLabel}
                description={t.weekStartDescription}
              >
                <SegmentedOptions
                  label={t.weekStartLabel}
                  options={weekStartOptions}
                  value={weekStartDay}
                  onChange={setWeekStartDay}
                />
              </SettingsRow>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
