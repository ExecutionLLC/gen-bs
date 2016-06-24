FROM ubuntu:14.04
MAINTAINER Loginov Vasily <vasily.loginov@execution.su>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gcc \
    g++ \
    git \
    openssh-client \
    libssl-dev \
    ca-certificates

# Fix 'stdin: is not a tty' error
RUN cat ${HOME}/.profile | grep -v mesg > ${HOME}/profile-modified
RUN mv ${HOME}/profile-modified ${HOME}/.profile

# Setting up SSH
COPY ssh/ /root/.ssh
RUN chmod go-rwx /root/.ssh/*

# Cloning sources
RUN ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts
RUN GIT_SSH_COMMAND="ssh -i /root/.ssh/id_rsa -F /dev/null" git clone git@github.com:ExecutionLLC/gen-bs.git /webserver

# Setting up Node Version Manager using manual installation.
ENV NVM_VERSION=e1c84ba
RUN git clone https://github.com/creationix/nvm.git ${HOME}/.nvm && cd ${HOME}/.nvm && git checkout ${NVM_VERSION}
RUN echo '. ~/.nvm/nvm.sh' >> $HOME/.profile

# Install web server using the separate script because we are unable to load .rc env here.
COPY scripts/install-webserver.sh /root
RUN bash /root/install-webserver.sh
