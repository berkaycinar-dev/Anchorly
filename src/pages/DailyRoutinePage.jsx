export default function DailyRoutinePage({
  routineMonth,
  addRoutine,
  newRoutineTitle,
  setNewRoutineTitle,
  setRoutineMounth,
  routineYear,
  routineMonthIndex,
  routineDays,
  routines,
  deleteRoutine,
  routineChecks,
  getRoutineKey,
  toggleRoutineCheck,
  today,
}) {
  const now = new Date();
  const isCurrentMonth =
    routineYear === now.getFullYear() && routineMonthIndex === now.getMonth();
  const todayDayNumber = now.getDate();

  function goToPrevious() {
    setRoutineMounth(new Date(routineYear, routineMonthIndex - 1, 1));
  }

  function goToNext() {
    setRoutineMounth(new Date(routineYear, routineMonthIndex + 1, 1));
  }

  return (
    <section className="routine-page">
      <div className="calendar-nav">
        <button
          className="calendar-nav-arrow"
          aria-label="Önceki Ay"
          onClick={goToPrevious}
        >
          ‹
        </button>

        <span className="calendar-nav-label routine-nav-label">
          {routineMonth.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
          })}
        </span>

        <button
          className="calendar-nav-arrow"
          aria-label="Sonraki Ay"
          onClick={goToNext}
        >
          ›
        </button>
      </div>

      <form className="routine-form" onSubmit={addRoutine}>
        <input
          type="text"
          placeholder="Yeni rutin ekle..."
          value={newRoutineTitle}
          onChange={(event) => setNewRoutineTitle(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Rutin Ekle
        </button>
      </form>

      <div className="routine-table-wrapper">
        <table className="routine-table">
          <thead>
            <tr>
              <th>Rutin</th>
              {routineDays.map((day) => (
                <th
                  key={day}
                  className={
                    isCurrentMonth && day === todayDayNumber
                      ? "routine-today-col"
                      : ""
                  }
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {routines.map((routine) => (
              <tr key={routine.id}>
                <td>
                  <div className="routine-name-cell">
                    <span>{routine.title}</span>
                    <button
                      className="routine-delete-button"
                      aria-label="Rutini sil"
                      onClick={() => deleteRoutine(routine.id)}
                    >
                      x
                    </button>
                  </div>
                </td>

                {routineDays.map((day) => (
                  <td
                    key={day}
                    className={
                      isCurrentMonth && day === todayDayNumber
                        ? "routine-today-col"
                        : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        routineChecks[getRoutineKey(routine.id, day)],
                      )}
                      onChange={() => toggleRoutineCheck(routine.id, day)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
