include("./model.jl")

import JSON
samples = map(
    (_) -> begin
        trace = Gen.simulate(cosine_model, ());
        [trace[:A], trace[:Z]]
    end,
    1:20,
)
write("./samples.json", JSON.json(samples))
