from fastapi import FastAPI
from ortools.sat.python import cp_model

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Python solver is running"}

@app.post("/generate_timetable")
def generate_timetable(data: dict):
    try:
        # Validate required fields
        required_fields = ["days", "periods", "period_times", "faculties", "classrooms", "class_requirements"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}", "scheduled": [], "status": "ERROR"}
        
        model = cp_model.CpModel()
        solver = cp_model.CpSolver()

        DAYS_LOCAL = data["days"]
        PERIODS_LOCAL = data["periods"]
        period_times = data["period_times"]

        # Build variable map: (req_id, day, period, room_id) -> BoolVar
        vars_map = {}
        for req in data["class_requirements"]:
            for d in DAYS_LOCAL:
                for p in PERIODS_LOCAL:
                    for room in data["classrooms"]:
                        key = (req["id"], d, p, room["id"])
                        vars_map[key] = model.NewBoolVar(f"x_{req['id']}_{d}_{p}_{room['id']}")

        # ------------------------------
        # Constraints
        # ------------------------------

        # 1) Same faculty cannot teach two classes at the same time
        for d in DAYS_LOCAL:
            for p in PERIODS_LOCAL:
                for fac in data["faculties"]:
                    same_fac = [
                        vars_map[key] for key in vars_map
                        if key[1] == d and key[2] == p and
                           next(r for r in data["class_requirements"] if r["id"] == key[0])["faculty"] == fac["id"]
                    ]
                    if same_fac:
                        model.Add(sum(same_fac) <= 1)

        # 2) No room conflict: a room cannot host >1 class in same day & period
        for d in DAYS_LOCAL:
            for p in PERIODS_LOCAL:
                for room in data["classrooms"]:
                    same_room = [
                        vars_map[key] for key in vars_map
                        if key[1] == d and key[2] == p and key[3] == room["id"]
                    ]
                    if same_room:
                        model.Add(sum(same_room) <= 1)

        # 3) Faculty min/max hours per week
        for fac in data["faculties"]:
            fac_req_ids = [r["id"] for r in data["class_requirements"] if r["faculty"] == fac["id"]]
            fac_vars = [vars_map[key] for key in vars_map if key[0] in fac_req_ids]
            if fac_vars:
                model.Add(sum(fac_vars) >= fac["min_hours_per_week"])
                model.Add(sum(fac_vars) <= fac["max_hours_per_week"])

        # 4) Each class requirement scheduled exactly once (or adjust if needed)
        for req in data["class_requirements"]:
            req_vars = [vars_map[key] for key in vars_map if key[0] == req["id"]]
            if req_vars:
                model.Add(sum(req_vars) == 1)

        # ------------------------------
        # Solve model
        # ------------------------------
        solver.parameters.max_time_in_seconds = 30
        status = solver.Solve(model)

        # ------------------------------
        # Output results
        # ------------------------------
        scheduled = []
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for key, var in vars_map.items():
                if solver.Value(var) == 1:
                    req_id, d, p, room_id = key
                    req = next(r for r in data["class_requirements"] if r["id"] == req_id)
                    scheduled.append({
                        "day": d,
                        "period": p,
                        "start_time": period_times[str(p)][0],
                        "end_time": period_times[str(p)][1],
                        "faculty": req["faculty"],
                        "section": req["section"],
                        "subject": req["subject"],
                        "class_type": req["class_type"],
                        "classroom": room_id
                    })

        return {
            "scheduled": scheduled,
            "status": solver.StatusName(status)
        }
    except Exception as e:
        return {
            "error": f"Error in solver: {str(e)}",
            "scheduled": [],
            "status": "ERROR"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("solver_api:app", host="0.0.0.0", port=8000, reload=True)
