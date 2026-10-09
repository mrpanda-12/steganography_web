#[derive(Clone, Copy)]
pub enum Channel {
    Red,
    Green,
    Blue
}

impl Channel {
    pub fn index(self) -> usize {
        match self {
            Channel::Red => 0,
            Channel::Green => 1,
            Channel::Blue => 2
        }
    }
}