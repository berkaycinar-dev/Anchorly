import { DASHBOARD_CARDS } from "../../constants/dashboardCards";

function CardLibrary({ cards, pickedSlot, t, onAdd, onRemove }) {
  const shownIds = new Set(cards.map((entry) => entry.id));

  return (
    <aside className="card-library" aria-labelledby="card-library-title">
      <div className="card-library-head">
        <h3 id="card-library-title">{t.cardLibraryTitle}</h3>
        <p>{t.cardLibraryCount(cards.length, DASHBOARD_CARDS.length)}</p>
      </div>

      <ul className="card-library-list">
        {DASHBOARD_CARDS.map((card) => {
          const name = t.cardNames[card.id];
          const isShown = shownIds.has(card.id);

          return (
            <li key={card.id} className="card-library-item">
              <div className="card-library-text">
                <span className="card-library-name">{name}</span>
                <span className="card-library-desc">
                  {t.cardDescriptions[card.id]}
                </span>
              </div>
              {isShown ? (
                <button
                  type="button"
                  className="btn btn-secondary card-library-action"
                  aria-label={t.cardRemoveLabel(name)}
                  onClick={() => onRemove(card.id)}
                >
                  {t.cardRemove}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary card-library-action"
                  aria-label={t.cardAddLabel(name)}
                  onClick={() => onAdd(card.id)}
                >
                  {pickedSlot === null ? t.cardAdd : t.cardAddToSlot}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default CardLibrary;
