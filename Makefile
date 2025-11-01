# Local development
LOCAL_DEV_PROJECT		 := local-app-env
LOCAL_DOCKER_COMPOSE := docker compose -p ${LOCAL_DEV_PROJECT} -f docker/dev-docker-compose.yml
LOCAL_MAIN_APP       := local-app

# All-in-one
ALL_IN_PROJECT		    := all-in-one
ALL_IN_DOCKER_COMPOSE := docker compose -p ${ALL_IN_PROJECT} -f docker/all-in.docker-compose.yml
ALL_IN_APP            := pi-detector-all-in-app-ui

# Local development
local-up:
	$(LOCAL_DOCKER_COMPOSE) build $(LOCAL_MAIN_APP)
	$(LOCAL_DOCKER_COMPOSE) up $(LOCAL_MAIN_APP) -d
	${LOCAL_DOCKER_COMPOSE} exec -it $(LOCAL_MAIN_APP) /bin/bash
	
local-down:
	${LOCAL_DOCKER_COMPOSE} down --volumes

# All in one. for tryout
all-in-up:
	@set -a && . ./docker/all-in.env && set +a && \
	echo "Using VITE_PII_DETECTOR_API_ENDPOINT=$$VITE_PII_DETECTOR_API_ENDPOINT" && \
	$(ALL_IN_DOCKER_COMPOSE) build $(ALL_IN_APP) --no-cache && \
	$(ALL_IN_DOCKER_COMPOSE) up $(ALL_IN_APP)

all-in-down:
	$(ALL_IN_DOCKER_COMPOSE) down --volumes