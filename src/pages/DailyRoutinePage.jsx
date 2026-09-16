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
}) {
  return (
    <section className="routine-page">
      <div className="routine-header">
        <div>
          <h2>Günlük Rutin</h2>
          <p>
            {routineMonth.toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })}
          </p>
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

        <div className="routine-month-actions">
          <button
            onClick={() =>
              setRoutineMounth(new Date(routineYear, routineMonthIndex - 1, 1))
            }
          >
            Önceki Ay
          </button>

          <button
            onClick={() =>
              setRoutineMounth(new Date(routineYear, routineMonthIndex + 1, 1))
            }
          >
            Sonraki Ay
          </button>
        </div>
      </div>

      <div className="routine-table-wrapper">
        <table className="routine-table">
          <thead>
            <tr>
              <th>Rutin</th>
              {routineDays.map((day) => (
                <th key={day}>{day}</th>
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
                  <td key={day}>
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
