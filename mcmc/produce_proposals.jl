#---------------------------------------------------------------------------------------------
# create model and Metropolis-Hastings inference algorithm
#---------------------------------------------------------------------------------------------
using Gen;

# model
@gen function simple_gaussian_model()
    X = @trace(mvnormal([0.0, 0.0], [1.04 -0.96 ; -0.96 1.04]), :source);
    @trace(normal(X[2], 1.0), :measurement);
end

# inference
@gen function rw_proposal(trace, sigma)
    @trace(mvnormal(trace[:source], [sigma 0.0 ; 0.0 sigma]), :source);
end

function custom_mh_meta(trace, proposal, proposal_args)
    # propose a new trace
    proposal_args_fwd = (trace, proposal_args...,);
    (fwd_choices, fwd_weight, _) = Gen.propose(proposal, proposal_args_fwd);
    (proposal_trace, weight, _, discard) = update(trace, (), (), fwd_choices);

    # calculate accept/reject probability
    proposal_args_backward = (proposal_trace, proposal_args...,);
    (bwd_weight, _) = assess(proposal, proposal_args_backward, discard);
    alpha = weight - fwd_weight + bwd_weight;

    # return failed trace (not done in usual Gen.mh)
    (proposal_trace, log(rand()) < alpha)
end

function build_chain(init::Vector{<:Real}, measurement::Real, length::Int)
    # create chain and simple helper function for appending proposal data
    chain = [];
    function add_to_chain!(x, y, accept)
        push!(chain, Dict(:x => x, :y => y, :accept => accept));
    end

    # initialize the chain
    x, y = init;
    add_to_chain!(x, y, true);

    # produce a trace for the initial guess
    trace, = Gen.generate(
        simple_gaussian_model, 
        (), 
        choicemap((:source, [x,y]), (:measurement, measurement))
    );

    # iteratively build the chain
    for _=2:length
        # perform a proposal
        (proposal_trace, accepted) = custom_mh_meta(trace, rw_proposal, (0.25,));

        # add proposal data
        add_to_chain!(proposal_trace[:source]..., accepted);

        # update last accepted trace if necessary
        if accepted
            trace = proposal_trace;
        end
    end

    # return the chain
    chain
end

#---------------------------------------------------------------------------------------------
# output example Metropolis-Hastings chain
#---------------------------------------------------------------------------------------------
using JSON
chain = build_chain([0.0, 0.0], -1.98, 1000);
write("chain.json", JSON.json(chain));
