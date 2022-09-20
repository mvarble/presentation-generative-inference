using Gen

@gen function cosine_model()
    # sample some amplitude uniformly
    amplitude = {:A} ~ uniform(0.0, 10.0)

    # produce path from amplitude
    T(A) = t -> A * cos(t)
    path = T(amplitude)

    # measurement sample
    {:Z} ~ normal(path(π), 1.0)
end
